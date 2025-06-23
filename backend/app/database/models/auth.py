from sqlmodel import SQLModel, Field
from pydantic import EmailStr
from typing import Dict, Any
from uuid import UUID


class EmailPasswordLoginRequest(SQLModel):
    email: EmailStr
    password: str = Field(min_length=1)


class Token(SQLModel, table=False):
    access_token: str
    token_type: str


class JWTPayload(SQLModel, table=False):
    user: Dict[str, Any]
    exp: int
    iat: int = Field(description="Issued at timestamp")


class UserJWTData(SQLModel):
    id: str
    email: str  
    username: str


class EmailConfirmationRequest(SQLModel):
    frontend_url: str = Field(min_length=1, max_length=500)
    token: int
