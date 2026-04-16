import io
from typing import List

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import get_settings
from app.services.document_processor import DocumentProcessor
from app.services.llm import get_llm_provider
from app.utils.sanitizer import detect_prompt_injection

router = APIRouter(tags=["demo"])

_limiter = Limiter(key_func=get_remote_address)

DEMO_MAX_FILE_MB = 5
DEMO_MAX_QUESTIONS = 50
DEMO_MIN_QUESTIONS = 1


@router.post("/demo/generate-quiz")
@_limiter.limit("5/hour")
async def demo_generate_quiz(
    request: Request,
    files: List[UploadFile] = File(...),
    num_questions: int = Form(default=5),
) -> dict:
    """
    Unauthenticated demo endpoint.
    Accepts one or more PDF/DOCX files, extracts and combines their text,
    generates MCQs via LLM, returns them without storing anything in the database.
    Rate-limited to 5 requests per IP per hour.
    """
    settings = get_settings()

    # Validate question count
    num_questions = max(DEMO_MIN_QUESTIONS, min(num_questions, DEMO_MAX_QUESTIONS))

    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one file is required.",
        )

    combined_text_parts: list[str] = []
    filenames: list[str] = []

    for file in files:
        # Validate file type
        filename = file.filename or ""
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if ext not in settings.allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type for '{filename}'. Use PDF or DOCX.",
            )

        content = await file.read()

        # Validate size (demo cap: 5 MB per file)
        size_mb = len(content) / (1024 * 1024)
        if size_mb > DEMO_MAX_FILE_MB:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File '{filename}' exceeds the {DEMO_MAX_FILE_MB} MB demo limit.",
            )

        # Extract text
        processor = DocumentProcessor()
        extracted = processor.extract_text(content, ext)
        if not extracted or len(extracted.strip()) < 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Could not extract enough text from '{filename}'.",
            )

        # Security: detect prompt injection in document content
        if detect_prompt_injection(extracted):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Potentially unsafe content detected in '{filename}'.",
            )

        filenames.append(filename)
        # Allocate context proportionally across files (max 4000 chars each, total 8000)
        chars_per_file = max(1000, 8000 // len(files))
        combined_text_parts.append(extracted[:chars_per_file])

    context = "\n\n---\n\n".join(combined_text_parts)
    quiz_title = ", ".join(filenames) if len(filenames) <= 3 else f"{filenames[0]} + {len(filenames)-1} more"

    llm = get_llm_provider()
    questions = llm.generate_mcq(context=context, num_questions=num_questions, difficulty="medium")

    # Return only what the frontend needs (no correct_answer exposed until submit)
    return {
        "title": quiz_title,
        "num_questions": len(questions),
        "questions": [
            {
                "id": str(i),
                "prompt": q["prompt"],
                "options": q["options"],
                "correct_answer": q["correct_answer"],
                "explanation": q["explanation"],
            }
            for i, q in enumerate(questions)
        ],
    }
