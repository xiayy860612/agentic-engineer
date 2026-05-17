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


class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    is_active: bool
    created_at: str  # ISO8601 string


class CreateUserRequest(BaseModel):
    username: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=1, max_length=4096)
    role: str = Field(min_length=1, max_length=50)


class UpdateUserRequest(BaseModel):
    role: str | None = Field(default=None, max_length=50)
    is_active: bool | None = None
