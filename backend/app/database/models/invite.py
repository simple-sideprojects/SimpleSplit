from uuid import UUID
from datetime import datetime, timedelta
from sqlmodel import Field, SQLModel, Relationship
from app.database.models.base import BaseModel
from app.database.models.group import Group
from pydantic import EmailStr
from typing import Optional
import sqlalchemy as sa


class GroupInvite(BaseModel, table=True):
    __tablename__ = "group_invites"
    email: Optional[str] = Field(
        default=None, 
        nullable=True, 
        index=True, 
        max_length=255
    )
    group_id: UUID = Field(foreign_key="groups.id", ondelete="CASCADE")
    token: str = Field(index=True, unique=True)
    group: Group = Relationship(back_populates="invites")


class GroupInviteCreate(SQLModel):
    email: Optional[EmailStr] = None


class GroupInviteResponse(SQLModel):
    id: UUID
    email: Optional[str] = None
    group_id: UUID
    token: str
    created_at: datetime


class InvitationTokenResponse(SQLModel):
    token: str
