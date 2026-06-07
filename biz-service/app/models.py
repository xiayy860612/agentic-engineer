from sqlalchemy import BigInteger, Identity, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class InstrumentModel(Base):
    __tablename__ = "instruments"

    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        Identity(),
        primary_key=True,
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
