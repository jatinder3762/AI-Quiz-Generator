from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.core.config import get_settings
from app.db.session import get_db
from app.models.document import Document, DocumentChunk
from app.models.user import User
from app.schemas.document import DocumentListResponse, DocumentResponse
from app.services.document_processor import DocumentProcessor
from app.services.storage import StorageService
from app.services.vector_store import VectorStoreService
from app.utils.sanitizer import detect_prompt_injection

router = APIRouter(tags=["documents"])


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DocumentResponse:
    settings = get_settings()
    ext = file.filename.split(".")[-1].lower() if file.filename else ""
    if ext not in settings.allowed_extensions:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file type")

    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > settings.max_upload_size_mb:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File too large")

    processor = DocumentProcessor()
    extracted = processor.extract_text(content, ext)
    if not extracted:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not extract text")
    if detect_prompt_injection(extracted):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Potentially unsafe content detected")

    storage = StorageService()
    file_url = storage.upload_file(content=content, filename=file.filename, content_type=file.content_type or "")

    document = Document(
        user_id=user.id,
        filename=file.filename,
        file_url=file_url,
        file_type=ext,
        extracted_text=extracted,
    )
    db.add(document)
    await db.flush()

    chunks = processor.split_text(extracted)
    for idx, chunk in enumerate(chunks):
        db.add(DocumentChunk(document_id=document.id, chunk_index=idx, content=chunk, token_count=len(chunk.split())))

    vector = VectorStoreService()
    vector.upsert_chunks(document.id, chunks)

    await db.commit()
    await db.refresh(document)
    return DocumentResponse.model_validate(document)


@router.get("/documents", response_model=DocumentListResponse)
async def list_documents(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DocumentListResponse:
    result = await db.execute(select(Document).where(Document.user_id == user.id).order_by(Document.created_at.desc()))
    docs = result.scalars().all()
    return DocumentListResponse(items=[DocumentResponse.model_validate(d) for d in docs])
