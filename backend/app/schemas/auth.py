from pydantic import BaseModel, Field, field_validator

from app.models.enums import UserRole


def _validate_email(value: str) -> str:
    email = value.strip()
    if len(email) < 3 or len(email) > 255:
        raise ValueError("Email must be between 3 and 255 characters")
    if "@" not in email or email.startswith("@") or email.endswith("@"):
        raise ValueError("Email must contain a valid local-part and domain")
    local_part, domain = email.rsplit("@", 1)
    if not local_part or not domain or "." not in domain:
        raise ValueError("Email must contain a valid domain")
    return email.lower()


class RegisterRequest(BaseModel):
    email: str
    full_name: str = Field(min_length=2, max_length=255)
    password: str = Field(min_length=8, max_length=64)
    role: UserRole = UserRole.STUDENT

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return _validate_email(value)


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return _validate_email(value)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return _validate_email(value)

    class Config:
        from_attributes = True
