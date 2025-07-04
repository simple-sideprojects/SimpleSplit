from typing import TYPE_CHECKING, Optional
from uuid import UUID
from sqlmodel import Field, Relationship, SQLModel
from datetime import datetime
from .base import BaseModel

if TYPE_CHECKING:
    from app.database.models.transaction import Transaction
    from app.database.models.user import User


class TransactionParticipantBase(SQLModel):
    amount_owed: int = Field(
        description="Amount owed by this specific user for this transaction")
    transaction_id: UUID = Field(foreign_key="transactions.id", index=True)
    debtor_id: UUID = Field(foreign_key="users.id", index=True)


class TransactionParticipant(TransactionParticipantBase, BaseModel, table=True):
    __tablename__ = "transaction_participants"
    transaction: "Transaction" = Relationship(
        back_populates="participants")
    debtor: "User" = Relationship(
        back_populates="owed_transactions")


class TransactionParticipantCreate(SQLModel):
    amount_owed: int
    debtor_id: UUID


class TransactionParticipantRead(TransactionParticipantBase):
    id: UUID
    amount_owed: int
    created_at: datetime
    updated_at: datetime
    debtor: "User"


class TransactionParticipantUpdate(SQLModel):
    amount_owed: Optional[int] = None
