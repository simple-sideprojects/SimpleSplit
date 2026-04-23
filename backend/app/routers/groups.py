from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import select

from app.database.database import SessionDep
from app.database.models.group import CreateGroup, Group, GroupExpandedResponse, UpdateGroup
from app.database.models.transaction import Transaction, TransactionRead
from app.dependencies.auth import CurrentUser
from app.middleware.is_user_group import GroupMembership
from app.services.auth import oauth2_scheme
from app.services.balance import BalanceService

router = APIRouter(
    prefix="/groups",
    tags=["groups"],
    dependencies=[Depends(oauth2_scheme)],
)


@router.get("/", response_model=list[Group], status_code=status.HTTP_200_OK)
async def read_groups(current_user: CurrentUser) -> list[Group]:
    return current_user.groups


@router.get(
    "/{group_id}",
    response_model=GroupExpandedResponse,
    status_code=status.HTTP_200_OK,
)
async def read_group(
    group_id: UUID,
    session: SessionDep,
    current_user: CurrentUser,
    group: GroupMembership,
) -> GroupExpandedResponse:
    balance = BalanceService.calculate_balance(session, current_user.id, group_id)

    transactions_query = (
        select(Transaction)
        .where(Transaction.group_id == group_id)
        .order_by(Transaction.created_at.desc())
        .limit(10)
    )
    transactions = session.exec(transactions_query).all()

    return GroupExpandedResponse.model_validate(
        {**group.model_dump(), "balance": balance, "transactions": transactions}
    )


@router.get(
    "/{group_id}/transactions",
    tags=["transactions"],
    response_model=List[TransactionRead],
    status_code=status.HTTP_200_OK,
)
def read_group_transactions(
    *,
    session: SessionDep,
    group: GroupMembership,
    skip: int = 0,
    limit: int = Query(default=100, ge=1, le=200),
):
    statement = (
        select(Transaction)
        .where(Transaction.group_id == group.id)
        .order_by(Transaction.purchased_on.desc())
        .order_by(Transaction.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return session.exec(statement).all()


@router.post("/", response_model=Group, status_code=status.HTTP_201_CREATED)
async def create_group(
    group: CreateGroup,
    session: SessionDep,
    current_user: CurrentUser,
) -> Group:
    db_group = Group.model_validate(group)
    db_group.users.append(current_user)

    session.add(db_group)
    session.commit()
    session.refresh(db_group)

    return db_group


@router.put("/{group_id}", response_model=Group, status_code=status.HTTP_200_OK)
async def update_group(
    group: UpdateGroup,
    session: SessionDep,
    db_group: GroupMembership,
) -> Group:
    group_data = group.model_dump(exclude_unset=True)
    db_group.sqlmodel_update(group_data)

    session.add(db_group)
    session.commit()
    session.refresh(db_group)

    return db_group


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(session: SessionDep, db_group: GroupMembership):
    session.delete(db_group)
    session.commit()


@router.delete(
    "/{group_id}/users/{user_id}",
    status_code=status.HTTP_200_OK,
    response_model=GroupExpandedResponse,
)
async def delete_user_from_group(
    group_id: UUID,
    user_id: UUID,
    session: SessionDep,
    db_group: GroupMembership,
) -> Group:
    user = next((u for u in db_group.users if u.id == user_id), None)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    db_group.users.remove(user)
    session.add(db_group)
    session.commit()
    session.refresh(db_group)

    return db_group
