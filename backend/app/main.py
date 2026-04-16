import logging
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.api.routers import auth, demo, documents, quiz, results
from app.core.config import get_settings

settings = get_settings()
ERROR_LOG_PATH = Path(settings.error_log_file).resolve()
IS_LOCAL_ENV = settings.environment.strip().lower() in {"development", "dev", "local"}
DEBUG_TOOLS_ENABLED = settings.enable_debug_error_endpoint and (settings.debug or IS_LOCAL_ENV)


def configure_error_logger() -> logging.Logger:
    logger = logging.getLogger("app.errors")
    logger.setLevel(logging.ERROR)
    logger.propagate = False

    ERROR_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    resolved_file = str(ERROR_LOG_PATH)

    for handler in logger.handlers:
        if isinstance(handler, logging.FileHandler) and Path(handler.baseFilename).resolve() == ERROR_LOG_PATH:
            return logger

    file_handler = logging.FileHandler(resolved_file, encoding="utf-8")
    file_handler.setLevel(logging.ERROR)
    file_handler.setFormatter(
        logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s", "%Y-%m-%d %H:%M:%S")
    )
    logger.addHandler(file_handler)
    return logger


error_logger = configure_error_logger()

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title=settings.app_name, debug=settings.debug)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(settings.frontend_url)],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(demo.router, prefix=settings.api_v1_prefix)
app.include_router(documents.router, prefix=settings.api_v1_prefix)
app.include_router(quiz.router, prefix=settings.api_v1_prefix)
app.include_router(results.router, prefix=settings.api_v1_prefix)


@app.on_event("startup")
async def ensure_storage_bucket() -> None:
    import boto3
    import botocore.exceptions

    s = get_settings()
    try:
        client = boto3.client(
            "s3",
            endpoint_url=s.s3_endpoint_url,
            aws_access_key_id=s.s3_access_key_id,
            aws_secret_access_key=s.s3_secret_access_key,
            region_name=s.s3_region,
        )
        try:
            client.head_bucket(Bucket=s.s3_bucket_name)
        except botocore.exceptions.ClientError:
            client.create_bucket(Bucket=s.s3_bucket_name)
    except Exception:
        pass  # MinIO may not be available in all environments


@app.middleware("http")
async def capture_unhandled_exceptions(request: Request, call_next):
    try:
        return await call_next(request)
    except BaseException as exc:
        error_id = uuid4().hex[:12]
        error_logger.exception("error_id=%s path=%s method=%s", error_id, request.url.path, request.method)
        payload: dict[str, str] = {"detail": "Internal Server Error", "error_id": error_id}
        if DEBUG_TOOLS_ENABLED:
            payload["error"] = str(exc)
        return JSONResponse(status_code=500, content=payload)


@app.get("/")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}


@app.get(f"{settings.api_v1_prefix}/debug/error-log")
async def debug_error_log(lines: int = Query(default=100, ge=1, le=2000)) -> dict[str, object]:
    if not DEBUG_TOOLS_ENABLED:
        raise HTTPException(status_code=404, detail="Not found")

    if not ERROR_LOG_PATH.exists():
        return {"path": str(ERROR_LOG_PATH), "lines": []}

    log_lines = ERROR_LOG_PATH.read_text(encoding="utf-8", errors="replace").splitlines()[-lines:]
    return {"path": str(ERROR_LOG_PATH), "lines": log_lines}
