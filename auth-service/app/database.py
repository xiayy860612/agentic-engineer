from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import get_settings

_engine = None
_SessionLocal: sessionmaker[Session] | None = None


class Base(DeclarativeBase):
    pass


def _configure_engine() -> None:
    global _engine, _SessionLocal
    settings = get_settings()
    url = settings.auth_database_url
    connect_args: dict[str, object] = {}
    pool_kw: dict[str, object] = {}
    if url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
        if url.endswith(":memory:") or url.rstrip("/").endswith(":memory"):
            pool_kw["poolclass"] = StaticPool
    eng = create_engine(url, connect_args=connect_args, **pool_kw)
    _engine = eng
    _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=eng)


def get_engine():
    global _engine
    if _engine is None:
        _configure_engine()
    return _engine


def get_session_local() -> sessionmaker[Session]:
    global _SessionLocal
    if _SessionLocal is None:
        _configure_engine()
    assert _SessionLocal is not None
    return _SessionLocal


def get_db() -> Generator[Session, None, None]:
    db = get_session_local()()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from app import models  # noqa: F401 — register models

    Base.metadata.create_all(bind=get_engine())


def reset_engine_for_tests() -> None:
    """Dispose engine so next access picks fresh settings (tests only)."""
    global _engine, _SessionLocal
    if _engine is not None:
        _engine.dispose()
    _engine = None
    _SessionLocal = None
