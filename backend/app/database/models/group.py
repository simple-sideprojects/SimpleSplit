from sqlmodel import Field, Relationship, SQLModel
from app.database.models.base import BaseModel
from app.database.models.users_groups import UsersGroups


class Group(BaseModel, table=True):
    __tablename__ = "groups"
    name: str = Field(index=True)
    users: list['User'] = Relationship(  # type: ignore
        back_populates="groups",
        link_model=UsersGroups
    )
    invites: list['GroupInvite'] = Relationship(  # type: ignore
        back_populates="group")


class CreateGroup(SQLModel):
    name: str = Field(index=True)
