from __future__ import annotations

from fastapi import Request, HTTPException


def require_admin(request: Request) -> None:
    """FastAPI dependency — requires 'admin' role in session, raises 403 otherwise."""
    token = request.cookies.get("ae_session")
    store = request.app.state.session_store
    rec = store.get(token)
    if rec is None:
        raise HTTPException(status_code=401, detail="unauthenticated")
    if not any(r in rec.roles for r in ("admin", "super_admin")):
        raise HTTPException(status_code=403, detail="无访问权限")