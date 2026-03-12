from chromadb.config import Settings as ChromaSettings
from langchain_chroma import Chroma
from langchain_core.embeddings import FakeEmbeddings
from langchain_openai import OpenAIEmbeddings

from app.core.config import get_settings


class VectorStoreService:
    def __init__(self) -> None:
        settings = get_settings()
        if settings.openai_api_key:
            embeddings = OpenAIEmbeddings(model=settings.embeddings_model, api_key=settings.openai_api_key)
        else:
            embeddings = FakeEmbeddings(size=1536)
        self.store = Chroma(
            collection_name="document_chunks",
            embedding_function=embeddings,
            client_settings=ChromaSettings(anonymized_telemetry=False),
            persist_directory=settings.chroma_persist_directory,
        )

    def upsert_chunks(self, document_id: str, chunks: list[str]) -> None:
        ids = [f"{document_id}:{idx}" for idx in range(len(chunks))]
        metadatas = [{"document_id": document_id, "chunk_index": idx} for idx in range(len(chunks))]
        self.store.add_texts(texts=chunks, metadatas=metadatas, ids=ids)

    def search_chunks(self, document_id: str, query: str, k: int = 6) -> list[str]:
        docs = self.store.similarity_search(query, k=k, filter={"document_id": document_id})
        return [d.page_content for d in docs]
