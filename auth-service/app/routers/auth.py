from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import User
from app.schemas import LoginRequest
from app.security import verify_password

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

INVALID_CREDENTIALS_BODY: dict[str, str] = {
    "error": "invalid_credentials",
    "message": "用户名或密码错误",
}


@router.post(
    "/login",
    responses={
        200: {"description": "OK", "content": {"application/json": {"example": {"success": True}}}},
        401: {
            "description": "Invalid credentials",
            "content": {"application/json": {"example": INVALID_CREDENTIALS_BODY}},
        },
    },
    openapi_extra={"x-public": True},
)
def login(
    payload: LoginRequest,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> JSONResponse:
    settings = get_settings()
    user = db.scalars(select(User).where(User.username == payload.username)).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        return JSONResponse(status_code=401, content=INVALID_CREDENTIALS_BODY)

    store = request.app.state.session_store
    token = store.create(user.id, user.username, roles=list(user.roles))
    resp = JSONResponse(status_code=200, content={"success": True})
    resp.set_cookie(
        key="ae_session",
        value=token,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite="lax",
        path="/",
        max_age=settings.auth_session_ttl_seconds,
    )
    return resp


@router.post(
    "/logout",
    status_code=204,
    responses={204: {"description": "Session cleared"}},
    openapi_extra={"x-public": True},
)
def logout(request: Request) -> Response:
    settings = get_settings()
    token = request.cookies.get("ae_session")
    request.app.state.session_store.delete(token)
    out = Response(status_code=204)
    out.delete_cookie(
        key="ae_session",
        path="/",
        httponly=True,
        samesite="lax",
        secure=settings.auth_cookie_secure,
    )
    return out


@router.get(
    "/session",
    response_model=None,
    responses={
        200: {
            "description": "Authenticated",
            "content": {"application/json": {"example": {"username": "demo"}}},
        },
        401: {"description": "No valid session"},
    },
    openapi_extra={"x-public": True},
)
def read_session(request: Request) -> JSONResponse:
    token = request.cookies.get("ae_session")
    rec = request.app.state.session_store.get(token)
    if rec is None:
        return JSONResponse(
            status_code=401,
            content={"error": "unauthenticated", "message": "未登录或会话已失效"},
        )
    return JSONResponse(status_code=200, content={"username": rec.username})
