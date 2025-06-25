from typing import TYPE_CHECKING, Optional, List
from sqlmodel import Field, Relationship, SQLModel
from app.database.models.base import BaseModel
from app.database.models.users_groups import UsersGroups
from uuid import UUID
from datetime import datetime

# Import dependent models for type checking only to avoid circular imports
if TYPE_CHECKING:
    from app.database.models.transaction import Transaction
    from app.database.models.user import User
    from app.database.models.invite import GroupInvite
    from app.database.models.user import UserResponse
    from app.database.models.invite import GroupInviteResponse
    from app.database.models.balance import Balance
    from app.database.models.transaction import TransactionRead


class Group(BaseModel, table=True):
    __tablename__ = "groups"
    name: str = Field(index=True, min_length=1, max_length=100)
    users: list["User"] = Relationship(
        back_populates="groups",
        link_model=UsersGroups
    )
    invites: list["GroupInvite"] = Relationship(
        back_populates="group",
        cascade_delete=True
    )
    transactions: List["Transaction"] = Relationship(
        back_populates="group",
        cascade_delete=True
    )


class CreateGroup(SQLModel):
    name: str = Field(min_length=1, max_length=100)


class UpdateGroup(SQLModel):
    name: str = Field(default=None, min_length=1, max_length=100)


class GroupResponse(SQLModel):
    id: UUID
    name: str
    created_at: datetime
    updated_at: datetime


class GroupExpandedResponse(SQLModel):
    id: UUID
    name: str
    created_at: datetime
    updated_at: datetime
    users: list['UserResponse'] = []
    invites: Optional[list['GroupInviteResponse']] = []
    balance: Optional['Balance'] = None
    transactions: Optional[list['TransactionRead']] = []
