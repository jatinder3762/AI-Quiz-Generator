from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.api.routers import auth, documents, quiz, results
from app.core.config import get_settings

settings = get_settings()

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
app.include_router(documents.router, prefix=settings.api_v1_prefix)
app.include_router(quiz.router, prefix=settings.api_v1_prefix)
app.include_router(results.router, prefix=settings.api_v1_prefix)


@app.get("/")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}
