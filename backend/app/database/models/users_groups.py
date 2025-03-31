from uuid import UUID
from sqlmodel import Field, SQLModel


class UsersGroups(SQLModel, table=True):
    __tablename__ = "users_groups"
    group_id: UUID = Field(
        foreign_key="groups.id", primary_key=True)
    user_id: UUID = Field(
        foreign_key="users.id", primary_key=True)
