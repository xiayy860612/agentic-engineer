from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import dispose_engine, init_db
from app.openapi import OPENAPI_TAGS
from app.routers import instruments as instruments_router


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await init_db()
    yield
    await dispose_engine()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Agentic Biz",
        version="0.1.0",
        description="Business APIs with async SQLAlchemy and Supabase JWT auth.",
        lifespan=lifespan,
        openapi_tags=OPENAPI_TAGS,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )
    app.include_router(instruments_router.router)

    @app.get(
        "/health",
        tags=["health"],
        summary="Health check",
        description="Liveness probe; no authentication required.",
    )
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
