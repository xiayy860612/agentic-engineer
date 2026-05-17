from __future__ import annotations

from sqlalchemy import select

from app.config import get_settings
from app.database import get_session_local
from app.models import Role, User
from app.security import hash_password


def bootstrap_admin() -> None:
    """Create admin role and/or admin user if configured and not exists."""
    settings = get_settings()
    if not settings.admin_bootstrap_enabled:
        return

    username = settings.init_admin_username
    password = settings.init_admin_password

    if not username or not password:
        raise RuntimeError(
            "ADMIN_BOOTSTRAP_ENABLED is true but INIT_ADMIN_USERNAME "
            "or INIT_ADMIN_PASSWORD is not set"
        )

    db = get_session_local()()
    try:
        # Ensure admin role exists
        admin_role = db.scalars(select(Role).where(Role.name == "admin")).first()
        if admin_role is None:
            admin_role = Role(name="admin", description="Administrator")
            db.add(admin_role)
            db.commit()
            db.refresh(admin_role)

        # Check if user already exists
        existing = db.scalars(select(User).where(User.username == username)).first()
        if existing is not None:
            return

        # Create admin user
        user = User(
            username=username,
            password_hash=hash_password(password),
            is_active=True,
        )
        user.roles.append(admin_role)
        db.add(user)
        db.commit()
    finally:
        db.close()