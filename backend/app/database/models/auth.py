from uuid import UUID
from sqlmodel import SQLModel


class EmailPasswordLoginRequest(SQLModel):
    email: str
    password: str


class Token(SQLModel, table=False):
    access_token: str
    token_type: str


class JWTPayload(SQLModel, table=False):
    user: dict = {
        "id": str,
        "email": str,
        "username": str
    }
