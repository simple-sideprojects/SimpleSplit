from typing import Optional
from uuid import UUID
from sqlmodel import SQLModel

from app.database.models.user import UserResponse


class UserBalance(SQLModel):
    user: UserResponse
    balance: int


class Balance(SQLModel):
    user_id: UUID
    group_id: Optional[UUID] = None
    total_balance: int
    total_owed_to_others: int
    total_owed_by_others: int
    user_balances: list[UserBalance]
