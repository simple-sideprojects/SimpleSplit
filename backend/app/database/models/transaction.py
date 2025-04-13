from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4
from sqlmodel import Field, Relationship, SQLModel
from app.database.models.base import BaseModel
from app.database.models.group import Group


class Transaction(BaseModel, table=True):
    __tablename__ = "transactions"
    transaction_name: str = Field(index=True)
    total_amount: int = Field(index=True)

    group_id: UUID = Field(foreign_key="groups.id")
    group: Optional[Group] = Relationship(back_populates="transactions")


class CreateTransaction(SQLModel, table=True):
    transaction_name: str = Field(index=True)
    total_amount: int = Field(index=True)

    group_id: UUID = Field(foreign_key="groups.id")
    group: Optional[Group] = Relationship(back_populates="transactions")
