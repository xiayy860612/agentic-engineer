from sqlalchemy import inspect
from app.models import Role, UserRole, User


def test_role_model_exists() -> None:
    assert hasattr(Role, "__tablename__")
    assert Role.__tablename__ == "roles"


def test_role_columns() -> None:
    cols = {c.name for c in inspect(Role).columns}
    assert "id" in cols
    assert "name" in cols
    assert "description" in cols


def test_user_role_junction_columns() -> None:
    cols = {c.name for c in inspect(UserRole).columns}
    assert "user_id" in cols
    assert "role_id" in cols


def test_user_has_is_active_and_created_at() -> None:
    cols = {c.name for c in inspect(User).columns}
    assert "is_active" in cols
    assert "created_at" in cols