from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import InstrumentModel
from app.schemas import Instrument


class InstrumentsFetchError(Exception):
    """Raised when the database fails to load instruments."""


async def fetch_instruments(session: AsyncSession) -> list[Instrument]:
    try:
        result = await session.scalars(select(InstrumentModel).order_by(InstrumentModel.id))
        return [Instrument.model_validate(row) for row in result.all()]
    except SQLAlchemyError as exc:
        raise InstrumentsFetchError("failed to load instruments") from exc
