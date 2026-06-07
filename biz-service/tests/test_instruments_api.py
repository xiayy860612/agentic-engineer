from datetime import UTC, datetime, timedelta

import jwt
import pytest
from app.auth import auth_user_from_payload
from app.jwks import SupabaseJwtVerifier
from app.models import InstrumentModel
from cryptography.hazmat.primitives.asymmetric import rsa
from jwt.exceptions import InvalidTokenError
from tests.conftest import _TEST_PRIVATE_KEY, make_access_token, test_jwt_verifier


def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_list_instruments_requires_auth(client):
    res = client.get("/api/v1/instruments")
    assert res.status_code == 401
    assert "authorization" in res.json()["detail"]


def test_list_instruments_rejects_invalid_token(client):
    res = client.get(
        "/api/v1/instruments",
        headers={"Authorization": "Bearer not-a-valid-jwt"},
    )
    assert res.status_code == 401
    assert res.json()["detail"] == "invalid or expired token"


def test_list_instruments(client, auth_headers):
    res = client.get("/api/v1/instruments", headers=auth_headers)
    assert res.status_code == 200
    assert res.json() == []


async def test_list_instruments_with_rows(client, auth_headers):
    from app.database import get_session_factory

    session_factory = get_session_factory()
    async with session_factory() as session:
        session.add_all(
            [
                InstrumentModel(name="violin"),
                InstrumentModel(name="viola"),
            ]
        )
        await session.commit()

    res = client.get("/api/v1/instruments", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert len(body) == 2
    assert body[0]["name"] == "violin"
    assert body[1]["name"] == "viola"
    assert body[0]["id"] < body[1]["id"]


async def test_fetch_instruments_unit(db_session):
    from app.instruments_service import fetch_instruments

    db_session.add(InstrumentModel(name="cello"))
    await db_session.commit()

    instruments = await fetch_instruments(db_session)
    assert len(instruments) == 1
    assert instruments[0].name == "cello"


def test_decode_access_token_via_jwks():
    token = make_access_token(sub="user-123", email="a@b.com")
    payload = test_jwt_verifier.decode_access_token(token)
    assert payload["sub"] == "user-123"
    assert payload["role"] == "authenticated"


def test_decode_access_token_rejects_wrong_key():
    other_private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    token = make_access_token(private_key=other_private_key)
    with pytest.raises(InvalidTokenError):
        test_jwt_verifier.decode_access_token(token)


def test_decode_access_token_rejects_expired_token():
    payload = {
        "sub": "user-123",
        "role": "authenticated",
        "aud": "authenticated",
        "exp": int((datetime.now(UTC) - timedelta(hours=1)).timestamp()),
    }
    token = jwt.encode(payload, _TEST_PRIVATE_KEY, algorithm="RS256")
    with pytest.raises(InvalidTokenError):
        test_jwt_verifier.decode_access_token(token)


def test_decode_access_token_rejects_missing_exp():
    payload = {
        "sub": "user-123",
        "role": "authenticated",
        "aud": "authenticated",
    }
    token = jwt.encode(payload, _TEST_PRIVATE_KEY, algorithm="RS256")
    with pytest.raises(InvalidTokenError):
        test_jwt_verifier.decode_access_token(token)


def test_list_instruments_rejects_expired_token(client):
    payload = {
        "sub": "00000000-0000-0000-0000-000000000001",
        "role": "authenticated",
        "aud": "authenticated",
        "exp": int((datetime.now(UTC) - timedelta(hours=1)).timestamp()),
    }
    token = jwt.encode(payload, _TEST_PRIVATE_KEY, algorithm="RS256")
    res = client.get(
        "/api/v1/instruments",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 401
    assert res.json()["detail"] == "invalid or expired token"


def test_supabase_jwt_verifier_wraps_jwks_client_errors(monkeypatch):
    class BrokenJwksClient:
        def get_signing_key_from_jwt(self, _token: str):
            from jwt.exceptions import PyJWKClientError

            raise PyJWKClientError("jwks unavailable")

    verifier = SupabaseJwtVerifier("http://example.test/jwks.json")
    monkeypatch.setattr(verifier, "_jwks_client", BrokenJwksClient())
    with pytest.raises(InvalidTokenError, match="jwks unavailable"):
        verifier.decode_access_token("header.payload.sig")


def test_auth_user_from_payload():
    user = auth_user_from_payload({"sub": "abc", "role": "authenticated", "email": "x@y.z"})
    assert user.sub == "abc"
    assert user.role == "authenticated"
    assert user.email == "x@y.z"


def test_auth_user_from_payload_missing_sub():
    with pytest.raises(InvalidTokenError):
        auth_user_from_payload({"role": "authenticated"})


def test_auth_user_from_payload_missing_role():
    with pytest.raises(InvalidTokenError):
        auth_user_from_payload({"sub": "abc"})
