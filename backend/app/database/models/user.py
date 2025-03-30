from uuid import UUID
from sqlmodel import Field, Relationship
from pydantic import EmailStr

from app.database.models.base import BaseModel
from app.database.models.group import Group
from app.database.models.users_groups import UsersGroups
from pydantic import BaseModel as PydanticBaseModel
from datetime import datetime


class User(BaseModel, table=True):
    __tablename__ = "users"
    username: str = Field()
    email: str = Field(index=True)
    password: str = Field(str)
    groups: list[Group] = Relationship(
        back_populates="users",
        link_model=UsersGroups
    )


class UserCreate(PydanticBaseModel):
    email: EmailStr
    password: str
    username: str


class UserResponse(PydanticBaseModel):
    id: UUID
    email: EmailStr
    username: str
    created_at: datetime
    updated_at: datetime
