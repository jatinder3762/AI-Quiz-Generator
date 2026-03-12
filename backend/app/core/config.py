from functools import lru_cache
from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Quiz Generator Platform"
    api_v1_prefix: str = "/api/v1"
    environment: str = "development"
    debug: bool = True

    secret_key: str = Field(default="change-me-in-production", min_length=16)
    access_token_expire_minutes: int = 60 * 24
    algorithm: str = "HS256"

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/ai_quiz"

    allowed_extensions: list[str] = ["pdf", "docx"]
    max_upload_size_mb: int = 15

    s3_endpoint_url: str | None = None
    s3_access_key_id: str | None = None
    s3_secret_access_key: str | None = None
    s3_bucket_name: str = "ai-quiz-files"
    s3_region: str = "us-east-1"

    chroma_persist_directory: str = "./chroma_data"
    embeddings_model: str = "text-embedding-3-small"

    llm_provider: str = "openai"
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"

    frontend_url: AnyHttpUrl = "http://localhost:3000"
    rate_limit_quiz_generation: str = "10/minute"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
