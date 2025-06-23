from uuid import UUID
from sqlmodel import Field, Relationship, SQLModel
from pydantic import EmailStr
from typing import TYPE_CHECKING, List

from app.database.models.base import BaseModel
from app.database.models.group import Group
from app.database.models.users_groups import UsersGroups
from datetime import datetime

if TYPE_CHECKING:
    from app.database.models.transaction import Transaction
    from app.database.models.transaction_participant import TransactionParticipant


class User(BaseModel, table=True):
    __tablename__ = "users"
    username: str = Field(index=True, min_length=1, max_length=50)
    email: str = Field(index=True, unique=True, min_length=1, max_length=255)
    email_verified: bool = Field(default=False)
    email_verification_token: int = Field(default=None, nullable=True)
    password: str = Field(min_length=8)
    groups: list[Group] = Relationship(
        back_populates="users",
        link_model=UsersGroups
    )
    paid_transactions: List["Transaction"] = Relationship(  # type: ignore
        back_populates="payer")
    owed_transactions: List["TransactionParticipant"] = Relationship(  # type: ignore
        back_populates="debtor")


class UserCreate(SQLModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=32)
    username: str = Field(min_length=1, max_length=50)


class UserResponse(SQLModel):
    id: UUID
    email: EmailStr
    username: str
    email_verified: bool
    created_at: datetime
    updated_at: datetime


class UserInfoUpdate(SQLModel):
    username: str = Field(min_length=1, max_length=50)


class UserUpdatePassword(SQLModel):
    old_password: str = Field(min_length=8)
    new_password: str = Field(min_length=8, max_length=32)
