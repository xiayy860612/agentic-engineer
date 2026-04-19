import os

# In-memory DB before importing the application (engine reads env at first use).
os.environ.setdefault("AUTH_DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("ADMIN_WEB_ORIGIN", "http://localhost:3000")

import pytest
from app.config import get_settings
from app.database import get_session_local, init_db, reset_engine_for_tests
from app.main import app
from app.models import User
from app.security import hash_password
from fastapi.testclient import TestClient


@pytest.fixture
def client() -> TestClient:
    get_settings.cache_clear()
    reset_engine_for_tests()
    with TestClient(app) as c:
        yield c


def seed_user(username: str, password: str) -> None:
    init_db()
    db = get_session_local()()
    try:
        db.add(User(username=username, password_hash=hash_password(password)))
        db.commit()
    finally:
        db.close()
