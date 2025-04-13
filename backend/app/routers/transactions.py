from datetime import datetime, timezone
from uuid import UUID
from fastapi import APIRouter, HTTPException

from app.database.database import SessionDep
from app.database.models.group import CreateGroup, Group
from app.database.models.transaction import CreateTranscation, Transaction

router = APIRouter(
    prefix="/transactions"
)


@router.post("/", tags=["transaction"])
async def create_transaction(transaction: CreateTranscation, session: SessionDep):
    db_transaction = Transaction.model_validate(transaction)
    session.add(db_transaction)
    session.commit()
    session.refresh(db_transaction)
    return db_transaction
