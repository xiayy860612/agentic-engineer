from app.database import get_session_local, init_db, seed_roles_and_admin, reset_engine_for_tests
from app.models import Role, User
from sqlalchemy import select


def test_seed_creates_two_roles(client) -> None:
    seed_roles_and_admin()
    db = get_session_local()()
    try:
        roles = db.scalars(select(Role)).all()
        role_names = {r.name for r in roles}
        assert "super_admin" in role_names
        assert "user" in role_names
    finally:
        db.close()


def test_seed_creates_default_admin(client) -> None:
    seed_roles_and_admin()
    db = get_session_local()()
    try:
        admin = db.scalars(select(User).where(User.username == "admin")).first()
        assert admin is not None
        assert admin.is_active is True
    finally:
        db.close()


def test_seed_is_idempotent(client) -> None:
    seed_roles_and_admin()
    seed_roles_and_admin()  # should not raise
    db = get_session_local()()
    try:
        count = db.scalars(select(Role)).all()
        assert len(count) == 2
    finally:
        db.close()