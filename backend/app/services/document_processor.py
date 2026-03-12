from pathlib import Path
from uuid import uuid4

from docx import Document as DocxDocument
from langchain.text_splitter import RecursiveCharacterTextSplitter
from pypdf import PdfReader

from app.utils.sanitizer import clean_text


class DocumentProcessor:
    def extract_text(self, file_bytes: bytes, file_type: str) -> str:
        suffix = ".pdf" if file_type == "pdf" else ".docx"
        temp_path = Path("uploads") / f"temp-{uuid4()}{suffix}"
        temp_path.parent.mkdir(parents=True, exist_ok=True)
        temp_path.write_bytes(file_bytes)
        try:
            if file_type == "pdf":
                reader = PdfReader(str(temp_path))
                text = "\n".join(page.extract_text() or "" for page in reader.pages)
            else:
                doc = DocxDocument(str(temp_path))
                text = "\n".join(p.text for p in doc.paragraphs)
            return clean_text(text)
        finally:
            temp_path.unlink(missing_ok=True)

    def split_text(self, text: str) -> list[str]:
        splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100)
        return splitter.split_text(text)
