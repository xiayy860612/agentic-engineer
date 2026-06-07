from pydantic import BaseModel, ConfigDict


class Instrument(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class ErrorDetail(BaseModel):
    detail: str
