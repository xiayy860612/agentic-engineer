from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=1, max_length=4096)


class LoginSuccessResponse(BaseModel):
    success: bool = True


class ErrorResponse(BaseModel):
    error: str
    message: str


class SessionResponse(BaseModel):
    username: str
    roles: list[str]
