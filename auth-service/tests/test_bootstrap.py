import pytest
from sqlalchemy import select

from app.config import get_settings
from app.database import get_session_local, init_db, reset_engine_for_tests
from app.main import create_app
from app.models import Role, User


def test_bootstrap_creates_admin_user(monkeypatch):
    get_settings.cache_clear()
    monkeypatch.setenv("INIT_ADMIN_USERNAME", "boot_admin")
    monkeypatch.setenv("INIT_ADMIN_PASSWORD", "boot_secret123")
    monkeypatch.setenv("ADMIN_BOOTSTRAP_ENABLED", "true")

    reset_engine_for_tests()
    init_db()  # ensure tables created with fresh engine

    from app.bootstrap import bootstrap_admin
    bootstrap_admin()  # call directly since lifespan is not triggered with create_app() alone

    db = get_session_local()()
    try:
        admin = db.scalars(select(User).where(User.username == "boot_admin")).first()
        assert admin is not None
        assert admin.is_active is True
        admin_role = db.scalars(select(Role).where(Role.name == "admin")).first()
        assert admin_role is not None
        assert admin_role in admin.roles
    finally:
        db.close()


def test_bootstrap_skips_if_user_exists(monkeypatch):
    get_settings.cache_clear()
    monkeypatch.setenv("INIT_ADMIN_USERNAME", "boot_admin2")
    monkeypatch.setenv("INIT_ADMIN_PASSWORD", "boot_secret123")
    monkeypatch.setenv("ADMIN_BOOTSTRAP_ENABLED", "true")

    reset_engine_for_tests()
    init_db()  # ensure tables created with fresh engine

    from app.bootstrap import bootstrap_admin
    bootstrap_admin()  # first call creates
    bootstrap_admin()  # second call should skip

    db = get_session_local()()
    try:
        admin = db.scalars(select(User).where(User.username == "boot_admin2")).first()
        assert admin is not None
    finally:
        db.close()


def test_bootstrap_disabled_by_default(monkeypatch):
    get_settings.cache_clear()
    monkeypatch.delenv("ADMIN_BOOTSTRAP_ENABLED", raising=False)
    monkeypatch.delenv("INIT_ADMIN_USERNAME", raising=False)
    monkeypatch.delenv("INIT_ADMIN_PASSWORD", raising=False)

    reset_engine_for_tests()
    init_db()  # ensure tables created with fresh engine

    from app.bootstrap import bootstrap_admin
    bootstrap_admin()  # Should not raise, no env vars needed


def test_bootstrap_requires_both_vars(monkeypatch):
    get_settings.cache_clear()
    monkeypatch.setenv("ADMIN_BOOTSTRAP_ENABLED", "true")
    monkeypatch.setenv("INIT_ADMIN_USERNAME", "only_username")
    # INIT_ADMIN_PASSWORD not set

    reset_engine_for_tests()
    init_db()  # ensure tables created with fresh engine

    from app.bootstrap import bootstrap_admin
    with pytest.raises(RuntimeError) as exc_info:
        bootstrap_admin()
    assert "INIT_ADMIN_PASSWORD" in str(exc_info.value)