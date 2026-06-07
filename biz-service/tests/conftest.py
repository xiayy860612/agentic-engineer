import os

_TEST_DB_URL = "sqlite+aiosqlite:///file:biz_test?mode=memory&cache=shared&uri=true"
_TEST_JWKS_URL = "http://localhost:54321/auth/v1/.well-known/jwks.json"

os.environ.setdefault("BIZ_DATABASE_URL", _TEST_DB_URL)
os.environ.setdefault("BIZ_JWKS_URL", _TEST_JWKS_URL)
os.environ.setdefault("BIZ_CORS_ORIGINS", "http://localhost:3000")

import asyncio
from collections.abc import AsyncGenerator
from datetime import UTC, datetime, timedelta

import jwt
import pytest
from app.config import reset_settings_cache_for_tests
from app.database import get_session_factory, reset_engine_for_tests
from app.jwks import get_jwt_verifier, reset_jwt_verifier_for_tests
from app.main import app
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

TEST_JWT_KID = "test-jwt-kid"
_TEST_PRIVATE_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)
_TEST_PUBLIC_KEY = _TEST_PRIVATE_KEY.public_key()


class StaticJwksVerifier:
    """Test double that resolves tokens against a fixed public key (no HTTP)."""

    def __init__(self, public_key) -> None:
        self._public_key = public_key

    def decode_access_token(self, token: str) -> dict[str, object]:
        return jwt.decode(
            token,
            self._public_key,
            algorithms=["RS256"],
            audience="authenticated",
            options={
                "verify_exp": True,
                "require": ["exp", "sub", "aud"],
            },
        )


test_jwt_verifier = StaticJwksVerifier(_TEST_PUBLIC_KEY)


async def reset_test_database() -> None:
    from app import models  # noqa: F401
    from app.database import Base, get_engine

    async with get_engine().begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)


def make_access_token(
    *,
    sub: str = "00000000-0000-0000-0000-000000000001",
    role: str = "authenticated",
    private_key=_TEST_PRIVATE_KEY,
    email: str | None = "user@example.com",
) -> str:
    payload: dict[str, object] = {
        "sub": sub,
        "role": role,
        "aud": "authenticated",
        "exp": int((datetime.now(UTC) + timedelta(hours=1)).timestamp()),
    }
    if email is not None:
        payload["email"] = email
    return jwt.encode(
        payload,
        private_key,
        algorithm="RS256",
        headers={"kid": TEST_JWT_KID},
    )


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    reset_settings_cache_for_tests()
    reset_engine_for_tests()
    reset_jwt_verifier_for_tests()
    app.dependency_overrides[get_jwt_verifier] = lambda: test_jwt_verifier
    await reset_test_database()
    session_factory = get_session_factory()
    async with session_factory() as session:
        yield session
    app.dependency_overrides.pop(get_jwt_verifier, None)


@pytest.fixture
def client() -> TestClient:
    reset_settings_cache_for_tests()
    reset_engine_for_tests()
    reset_jwt_verifier_for_tests()
    app.dependency_overrides[get_jwt_verifier] = lambda: test_jwt_verifier
    asyncio.run(reset_test_database())
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.pop(get_jwt_verifier, None)


@pytest.fixture
def auth_headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {make_access_token()}"}
