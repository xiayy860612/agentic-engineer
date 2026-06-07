from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import AuthUser, get_current_user
from app.database import get_db
from app.instruments_service import InstrumentsFetchError, fetch_instruments
from app.schemas import ErrorDetail, Instrument

router = APIRouter(prefix="/v1/instruments", tags=["instruments"])


@router.get(
    "",
    response_model=list[Instrument],
    summary="List instruments",
    description="Returns all instruments ordered by id.",
    responses={
        401: {"model": ErrorDetail, "description": "Missing or invalid Bearer token."},
        502: {"model": ErrorDetail, "description": "Database fetch failed."},
    },
)
async def list_instruments(
    _user: Annotated[AuthUser, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[Instrument]:
    try:
        return await fetch_instruments(db)
    except InstrumentsFetchError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
