"""Tests for GET /api/v1/auth/session returning roles."""

from tests.conftest import seed_user


def test_session_returns_roles(client):
    # Seed roles and admin user directly in the test
    from app.database import get_session_local, init_db
    from app.models import User, Role
    from app.security import hash_password

    init_db()

    # Create roles admin and user
    db = get_session_local()()
    try:
        admin_role = Role(name="admin")
        user_role = Role(name="user")
        db.add(admin_role)
        db.add(user_role)
        db.commit()

        # Create admin user with admin role
        admin_user = User(
            username="admin",
            password_hash=hash_password("admin_secret"),
        )
        admin_user.roles.append(admin_role)
        db.add(admin_user)
        db.commit()
    finally:
        db.close()

    # Login as admin
    login_res = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin_secret"},
    )
    assert login_res.status_code == 200

    # Get session
    res = client.get("/api/v1/auth/session")
    assert res.status_code == 200
    data = res.json()
    assert "roles" in data, f"roles key missing from response: {data}"
    assert "admin" in data["roles"], f"admin role missing from {data['roles']}"


def test_session_unauthenticated_returns_401(client):
    res = client.get("/api/v1/auth/session")
    assert res.status_code == 401
    assert res.json()["error"] == "unauthenticated"