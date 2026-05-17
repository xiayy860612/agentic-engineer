from tests.conftest import seed_user


def test_login_inactive_user_returns_403(client) -> None:
    from app.database import get_session_local
    from app.models import User
    from sqlalchemy import select

    # Create user with seed_user (sets is_active=True by default)
    seed_user("inactive_user", "password123")

    # Now deactivate the user directly via DB session
    # Note: client fixture already created the user in its own session,
    # but we need to use the same session to modify
    from app.database import get_session_local as _get_session_local

    db = _get_session_local()()
    try:
        u = db.scalars(select(User).where(User.username == "inactive_user")).first()
        u.is_active = False
        db.commit()
    finally:
        db.close()

    res = client.post(
        "/api/v1/auth/login",
        json={"username": "inactive_user", "password": "password123"},
    )
    assert res.status_code == 403
    assert res.json()["error"] == "account_disabled"


def test_login_regular_user_returns_200_and_cannot_access_admin(client) -> None:
    from app.database import get_session_local
    from app.models import User, Role
    from sqlalchemy import select

    # First seed roles so we have a 'user' role
    from app.database import seed_roles_and_admin

    seed_roles_and_admin()

    # Create a regular user via seed_user
    seed_user("regular_user", "password123")

    # Assign 'user' role (not super_admin) to the regular_user
    db = get_session_local()()
    try:
        u = db.scalars(select(User).where(User.username == "regular_user")).first()
        user_role = db.scalars(select(Role).where(Role.name == "user")).first()
        if user_role and user_role not in u.roles:
            u.roles.append(user_role)
            db.commit()
    finally:
        db.close()

    # Regular user can log in successfully (200)
    res = client.post(
        "/api/v1/auth/login",
        json={"username": "regular_user", "password": "password123"},
    )
    assert res.status_code == 200
    assert res.json()["success"] is True

    # But regular user cannot access /api/v1/users (gets 403)
    users_res = client.get("/api/v1/users")
    assert users_res.status_code == 403


def test_login_super_admin_succeeds(client) -> None:
    from app.database import seed_roles_and_admin, get_session_local
    from app.models import User, Role
    from app.security import hash_password
    from sqlalchemy import select

    seed_roles_and_admin()

    # Create super admin user with proper hash
    db = get_session_local()()
    try:
        super_admin_role = db.scalars(select(Role).where(Role.name == "super_admin")).first()
        user = User(
            username="super_admin_user",
            password_hash=hash_password("password123"),
        )
        if super_admin_role:
            user.roles.append(super_admin_role)
        db.add(user)
        db.commit()
    finally:
        db.close()

    res = client.post(
        "/api/v1/auth/login",
        json={"username": "super_admin_user", "password": "password123"},
    )
    assert res.status_code == 200
    assert res.json()["success"] is True