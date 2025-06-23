from operator import or_
from typing import Annotated, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import select

from app import config
from app.database.database import SessionDep
from app.database.models import (
    Transaction, TransactionCreate, TransactionRead, TransactionUpdate, User, Group
)
from app.database.models.transaction_participant import TransactionParticipant
from app.middleware.is_user_group import is_user_in_group
from app.services.auth import AuthService, oauth2_scheme


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
    token: Annotated[str, Depends(oauth2_scheme)],
    settings: Annotated[config.Settings, Depends(config.get_settings)]
):
    current_user = await AuthService.get_current_user(session, token, settings)
    
    db_group = session.get(Group, transaction_in.group_id)
    if not db_group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    if current_user not in db_group.users:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have permission to create a transaction in this group"
        )

    # Create a proper SQLAlchemy Transaction instance
    db_transaction = Transaction(
        id=transaction_in.id,
        amount=transaction_in.amount,
        title=transaction_in.title,
        purchased_on=transaction_in.purchased_on,
        transaction_type=transaction_in.transaction_type,
        group_id=transaction_in.group_id,
        payer_id=transaction_in.payer_id
    )
    session.add(db_transaction)
    session.commit()

    # After committing the transaction, create and associate participants
    for participant in transaction_in.participants:
        db_participant = TransactionParticipant(
            transaction_id=db_transaction.id,
            debtor_id=participant.debtor_id,
            amount_owed=participant.amount_owed
        )
        session.add(db_participant)

    session.commit()
    session.refresh(db_transaction)

    return db_transaction


@router.get("/", response_model=List[TransactionRead], status_code=status.HTTP_200_OK)
async def read_transactions_user_is_participant_in(
    *,
    session: SessionDep,
    token_user: Annotated[str, Depends(oauth2_scheme)],
    settings: Annotated[config.Settings, Depends(config.get_settings)],
    skip: int = 0,
    limit: int = Query(default=100, ge=1, le=200),
    group_id: UUID | None = None
):
    user = await AuthService.get_current_user(session, token_user, settings)

    statement = select(Transaction).where(
        or_(
            Transaction.payer_id == user.id,
            Transaction.participants.any(
                TransactionParticipant.debtor_id == user.id)
        )
    ).offset(skip).limit(limit).order_by(Transaction.purchased_on.desc()).order_by(Transaction.created_at.desc())
    if group_id:
        statement = statement.where(
            Transaction.group_id == group_id
        )
    transactions = session.exec(statement).all()
    return transactions


@router.get("/{transaction_id}", response_model=TransactionRead, status_code=status.HTTP_200_OK)
async def read_transaction(
    transaction_id: UUID,
    session: SessionDep,
    token: Annotated[str, Depends(oauth2_scheme)],
    settings: Annotated[config.Settings, Depends(config.get_settings)]
):
    current_user = await AuthService.get_current_user(session, token, settings)
    
    transaction = session.get(Transaction, transaction_id)
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    group = session.get(Group, transaction.group_id)
    if transaction.payer_id != current_user.id and (not group or current_user not in group.users):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have permission to view this transaction"
        )

    return transaction


@router.put("/{transaction_id}", response_model=TransactionRead, status_code=status.HTTP_200_OK)
async def update_transaction(
    transaction_id: UUID,
    transaction_in: TransactionUpdate,
    session: SessionDep,
    token: Annotated[str, Depends(oauth2_scheme)],
    settings: Annotated[config.Settings, Depends(config.get_settings)]
):
    current_user = await AuthService.get_current_user(session, token, settings)
    
    db_transaction = session.get(Transaction, transaction_id)
    if not db_transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    if db_transaction.payer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the payer can update the transaction"
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
    token: Annotated[str, Depends(oauth2_scheme)],
    settings: Annotated[config.Settings, Depends(config.get_settings)]
):
    current_user = await AuthService.get_current_user(session, token, settings)
    
    transaction = session.get(Transaction, transaction_id)
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    if transaction.payer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the payer can delete the transaction"
        )

    session.delete(transaction)
    session.commit()
    return
