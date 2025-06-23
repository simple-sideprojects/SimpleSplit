from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, List, Optional
from uuid import UUID
import sqlalchemy as sa
from sqlmodel import Field, Relationship, SQLModel

from app.database.models.transaction_participant import TransactionParticipantRead
from .base import BaseModel

if TYPE_CHECKING:
    from app.database.models.user import User
    from app.database.models.group import Group
    from app.database.models.transaction_participant import TransactionParticipant
    from app.database.models.transaction_participant import TransactionParticipantCreate


class TransactionType(str, Enum):
    EVEN = "EVEN"
    AMOUNT = "AMOUNT"
    PERCENTAGE = "PERCENTAGE"


class TransactionBase(BaseModel):
    amount: int = Field(
        index=True, description="Total amount in smallest currency unit (e.g., cents)")
    title: str
    purchased_on: datetime = Field(
        default=None,
        sa_type=sa.DateTime(timezone=True),
        sa_column_kwargs={
            "server_default": sa.func.now()
        },
        nullable=False,
    )
    transaction_type: TransactionType = Field(
        default=TransactionType.EVEN, nullable=False)

    group_id: UUID = Field(foreign_key="groups.id", index=True)
    payer_id: UUID = Field(foreign_key="users.id", index=True)


class Transaction(TransactionBase, table=True):
    __tablename__ = "transactions"
    group: "Group" = Relationship(
        back_populates="transactions")
    payer: "User" = Relationship()
    participants: List["TransactionParticipant"] = Relationship(
        back_populates="transaction",
        cascade_delete=True
    )


class TransactionCreate(TransactionBase):
    participants: List["TransactionParticipantCreate"]


class TransactionRead(TransactionBase):
    participants: List["TransactionParticipantRead"]
    payer: "User"
    group: "Group"


class TransactionUpdate(SQLModel):
    amount: Optional[int] = None
    title: Optional[str] = None
    purchased_on: Optional[datetime] = None
    transaction_type: Optional[TransactionType] = None
    payer_id: Optional[UUID] = None
