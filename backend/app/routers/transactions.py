from operator import or_
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import select

from app.database.database import SessionDep
from app.database.models import (
    Group,
    Transaction,
    TransactionCreate,
    TransactionRead,
    TransactionUpdate,
)
from app.database.models.transaction_participant import TransactionParticipant
from app.dependencies.auth import CurrentUser
from app.services.auth import oauth2_scheme


router = APIRouter(
    prefix="/transactions",
    tags=["transactions"],
    dependencies=[Depends(oauth2_scheme)],
    responses={404: {"description": "Not found"}},
)


@router.post("/", response_model=TransactionRead, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction_in: TransactionCreate,
    session: SessionDep,
    current_user: CurrentUser,
):
    db_group = session.get(Group, transaction_in.group_id)
    if not db_group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    if current_user not in db_group.users:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have permission to create a transaction in this group",
        )

    db_transaction = Transaction(
        id=transaction_in.id,
        amount=transaction_in.amount,
        title=transaction_in.title,
        purchased_on=transaction_in.purchased_on,
        transaction_type=transaction_in.transaction_type,
        group_id=transaction_in.group_id,
        payer_id=transaction_in.payer_id,
    )

    try:
        session.add(db_transaction)
        session.flush()

        for participant in transaction_in.participants:
            session.add(
                TransactionParticipant(
                    transaction_id=db_transaction.id,
                    debtor_id=participant.debtor_id,
                    amount_owed=participant.amount_owed,
                )
            )

        session.commit()
    except SQLAlchemyError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create transaction",
        )

    session.refresh(db_transaction)
    return db_transaction


@router.get("/", response_model=List[TransactionRead], status_code=status.HTTP_200_OK)
async def read_transactions_user_is_participant_in(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = Query(default=100, ge=1, le=200),
    group_id: UUID | None = None,
):
    statement = (
        select(Transaction)
        .where(
            or_(
                Transaction.payer_id == current_user.id,
                Transaction.participants.any(TransactionParticipant.debtor_id == current_user.id),
            )
        )
        .offset(skip)
        .limit(limit)
        .order_by(Transaction.purchased_on.desc())
        .order_by(Transaction.created_at.desc())
    )
    if group_id:
        statement = statement.where(Transaction.group_id == group_id)
    return session.exec(statement).all()


@router.get("/{transaction_id}", response_model=TransactionRead, status_code=status.HTTP_200_OK)
async def read_transaction(
    transaction_id: UUID,
    session: SessionDep,
    current_user: CurrentUser,
):
    transaction = session.get(Transaction, transaction_id)
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found"
        )

    group = session.get(Group, transaction.group_id)
    if transaction.payer_id != current_user.id and (not group or current_user not in group.users):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have permission to view this transaction",
        )

    return transaction


@router.put("/{transaction_id}", response_model=TransactionRead, status_code=status.HTTP_200_OK)
async def update_transaction(
    transaction_id: UUID,
    transaction_in: TransactionUpdate,
    session: SessionDep,
    current_user: CurrentUser,
):
    db_transaction = session.get(Transaction, transaction_id)
    if not db_transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found"
        )

    if db_transaction.payer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the payer can update the transaction",
        )

    update_data = transaction_in.model_dump(exclude_unset=True)
    db_transaction.sqlmodel_update(update_data)

    session.add(db_transaction)
    session.commit()
    session.refresh(db_transaction)
    return db_transaction


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: UUID,
    session: SessionDep,
    current_user: CurrentUser,
):
    transaction = session.get(Transaction, transaction_id)
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found"
        )

    if transaction.payer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the payer can delete the transaction",
        )

    session.delete(transaction)
    session.commit()
