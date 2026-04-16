from functools import lru_cache
from pydantic import Field, field_validator
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

    ollama_base_url: str = "http://localhost:11434/v1"
    ollama_model: str = "llama3.2"

    groq_api_key: str | None = None
    groq_model: str = "llama-3.3-70b-versatile"

    frontend_url: str = "http://localhost:3001"
    rate_limit_quiz_generation: str = "10/minute"
    error_log_file: str = "./logs/backend-errors.log"
    enable_debug_error_endpoint: bool = True

    @field_validator("debug", mode="before")
    @classmethod
    def parse_debug_flag(cls, value: object) -> object:
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"1", "true", "yes", "on", "debug", "development", "dev"}:
                return True
            if normalized in {"0", "false", "no", "off", "release", "production", "prod"}:
                return False
        return value

    @field_validator("enable_debug_error_endpoint", mode="before")
    @classmethod
    def parse_debug_endpoint_flag(cls, value: object) -> object:
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"1", "true", "yes", "on"}:
                return True
            if normalized in {"0", "false", "no", "off"}:
                return False
        return value

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
