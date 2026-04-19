from fastapi.testclient import TestClient
from tests.conftest import seed_user


def test_login_unknown_user_matches_wrong_password_shape(client: TestClient) -> None:
    r_unknown = client.post(
        "/api/v1/auth/login",
        json={"username": "nope", "password": "anything"},
    )
    seed_user("alice", "correct")
    r_bad_pw = client.post(
        "/api/v1/auth/login",
        json={"username": "alice", "password": "wrong"},
    )
    assert r_unknown.status_code == 401
    assert r_bad_pw.status_code == 401
    assert r_unknown.json() == r_bad_pw.json()
    assert r_unknown.json() == {
        "error": "invalid_credentials",
        "message": "用户名或密码错误",
    }


def test_login_success_sets_session_cookie(client: TestClient) -> None:
    seed_user("bob", "secret-pass")
    res = client.post(
        "/api/v1/auth/login",
        json={"username": "bob", "password": "secret-pass"},
    )
    assert res.status_code == 200
    assert res.json() == {"success": True}
    assert client.cookies.get("ae_session")


def test_session_endpoint_after_login(client: TestClient) -> None:
    seed_user("carol", "pw")
    login = client.post("/api/v1/auth/login", json={"username": "carol", "password": "pw"})
    assert login.status_code == 200
    assert client.cookies.get("ae_session")
    me = client.get("/api/v1/auth/session")
    assert me.status_code == 200
    assert me.json() == {"username": "carol"}


def test_logout_clears_session(client: TestClient) -> None:
    seed_user("dave", "pw")
    login = client.post("/api/v1/auth/login", json={"username": "dave", "password": "pw"})
    assert login.status_code == 200
    assert client.cookies.get("ae_session")
    out = client.post("/api/v1/auth/logout")
    assert out.status_code == 204
    cleared = client.get("/api/v1/auth/session")
    assert cleared.status_code == 401


def test_cors_preflight_login(client: TestClient) -> None:
    res = client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "http://localhost:3000"
    assert res.headers.get("access-control-allow-credentials") == "true"
