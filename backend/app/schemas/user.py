from pydantic import BaseModel, field_validator
from typing import Optional
from app.models.enums import UserRole


class UserCreate(BaseModel):
    username: str
    email: Optional[str] = None
    password: str
    full_name: str
    role: UserRole
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if v and '@' not in v:
            raise ValueError('Invalid email format')
        return v


class UserResponse(BaseModel):
    id: int
    username: str
    email: Optional[str]
    full_name: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
