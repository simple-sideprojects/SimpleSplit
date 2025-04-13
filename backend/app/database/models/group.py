from typing import Optional, TYPE_CHECKING
from typing import List
from sqlmodel import Field, Relationship, Relationship, SQLModel
from app.database.models.base import BaseModel
from app.database.models.transaction import Transaction
from app.database.models.users_groups import UsersGroups
from uuid import UUID

# Import dependent models for type checking only to avoid circular imports
if TYPE_CHECKING:
    from app.database.models.user import UserResponse
    from app.database.models.invite import GroupInviteResponse


class Group(BaseModel, table=True):
    __tablename__ = "groups"
    name: str = Field(index=True)
    transactions: List["Transaction"] = Relationship(back_populates="group")
    users: list['User'] = Relationship(  # type: ignore
        back_populates="groups",
        link_model=UsersGroups
    )
    invites: list['GroupInvite'] = Relationship(  # type: ignore
        back_populates="group",
        cascade_delete=True
    )


class CreateGroup(SQLModel):
    name: str


class UpdateGroup(SQLModel):
    name: str


class GroupWithUsersResponse(SQLModel):
    id: UUID
    name: str
    users: list['UserResponse'] = []
    invites: Optional[list['GroupInviteResponse']] = []
