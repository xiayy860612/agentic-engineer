from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.routers import auth as auth_router
from app.session_store import InMemorySessionStore


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    ttl = get_settings().auth_session_ttl_seconds
    app.state.session_store = InMemorySessionStore(ttl)
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Agentic Auth",
        version="0.1.0",
        description="Login and session APIs for admin-web (stage 0). Issue #3.",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.admin_web_origin],
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "Cookie", "Authorization"],
    )
    app.include_router(auth_router.router)
    return app


app = create_app()
