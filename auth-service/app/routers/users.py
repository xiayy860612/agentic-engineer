from __future__ import annotations

from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin
from app.models import User, Role
from app.schemas import CreateUserRequest, UpdateUserRequest, UserResponse
from app.security import hash_password

router = APIRouter(prefix="/api/v1/users", tags=["users"])


def _user_to_response(user: User) -> UserResponse:
    role_name = next((r.name for r in user.roles if r.name in ("admin", "user")), "user")
    return UserResponse(
        id=user.id,
        username=user.username,
        role=role_name,
        is_active=user.is_active,
        created_at=user.created_at.isoformat(),
    )


@router.get("", response_model=list[UserResponse])
def list_users(
    request: Request,
    db: Session = Depends(get_db),
) -> list[UserResponse]:
    require_admin(request)
    users = db.scalars(select(User).order_by(User.created_at.desc())).unique().all()
    return [_user_to_response(u) for u in users]


@router.post("", status_code=201, response_model=UserResponse)
def create_user(
    request: Request,
    body: CreateUserRequest,
    db: Session = Depends(get_db),
) -> UserResponse:
    require_admin(request)

    existing = db.scalars(select(User).where(User.username == body.username)).first()
    if existing:
        raise HTTPException(status_code=409, detail="用户名已存在")

    if body.role not in ("admin", "user"):
        raise HTTPException(status_code=422, detail="Invalid role")

    role = db.scalars(select(Role).where(Role.name == body.role)).first()
    if role is None:
        role = Role(name=body.role)
        db.add(role)
        db.commit()
        db.refresh(role)

    user = User(
        username=body.username,
        password_hash=hash_password(body.password),
        is_active=True,
    )
    user.roles.append(role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return _user_to_response(user)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    request: Request,
    user_id: int,
    db: Session = Depends(get_db),
) -> UserResponse:
    require_admin(request)
    user = db.scalars(select(User).where(User.id == user_id)).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_to_response(user)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    request: Request,
    user_id: int,
    body: UpdateUserRequest,
    db: Session = Depends(get_db),
) -> UserResponse:
    require_admin(request)

    token = request.cookies.get("ae_session")
    rec = request.app.state.session_store.get(token)
    if rec and rec.user_id == user_id:
        raise HTTPException(status_code=403, detail="不能编辑自己的账户")

    user = db.scalars(select(User).where(User.id == user_id)).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    if body.role is not None:
        if body.role not in ("admin", "user"):
            raise HTTPException(status_code=422, detail="Invalid role")
        role = db.scalars(select(Role).where(Role.name == body.role)).first()
        if role is None:
            role = Role(name=body.role)
            db.add(role)
            db.commit()
            db.refresh(role)
        user.roles = [role]

    if body.is_active is not None:
        user.is_active = body.is_active

    db.commit()
    db.refresh(user)
    return _user_to_response(user)