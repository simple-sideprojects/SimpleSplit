from uuid import UUID
from sqlmodel import Field, Relationship, SQLModel
from pydantic import EmailStr

from app.database.models.base import BaseModel
from app.database.models.group import Group
from app.database.models.users_groups import UsersGroups
from datetime import datetime


class User(BaseModel, table=True):
    __tablename__ = "users"
    username: str = Field()
    email: str = Field(index=True)
    email_verified: bool = Field(default=False)
    email_verification_token: int = Field(default=None, nullable=True)
    password: str = Field(str)
    groups: list[Group] = Relationship(
        back_populates="users",
        link_model=UsersGroups
    )


class UserCreate(SQLModel):
    email: EmailStr
    password: str
    username: str


class UserResponse(SQLModel):
    id: UUID
    email: EmailStr
    username: str
    created_at: datetime
    updated_at: datetime


class UserInfoUpdate(SQLModel):
    username: str


class UserUpdatePassword(SQLModel):
    old_password: str
    new_password: str
