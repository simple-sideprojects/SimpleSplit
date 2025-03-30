from datetime import datetime, timezone
from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from app import config
from app.database.database import SessionDep
from app.database.models.group import CreateGroup, Group
from app.database.models.user import User
from app.services.auth import AuthService, oauth2_scheme

router = APIRouter(
    prefix="/groups",
    tags=["groups"],
    dependencies=[Depends(oauth2_scheme)]
)


@router.get("/", tags=["groups"], response_model=list[Group])
async def read_groups(session: SessionDep, token: Annotated[str, Depends(oauth2_scheme)], settings: Annotated[config.Settings, Depends(config.get_settings)]) -> list[Group]:
    user = await AuthService.get_current_user(session, token, settings)
    print(user.id)
    statement = select(User).where(User.id == user.id)
    user = session.exec(statement).first()
    return user.groups


@router.post("/", tags=["groups"], response_model=Group)
async def create_group(group: CreateGroup, session: SessionDep) -> Group:
    db_group = Group.model_validate(group)
    session.add(db_group)
    session.commit()
    session.refresh(db_group)
    return db_group


@router.put("/{group_id}", tags=["groups"], response_model=Group)
async def update_group(group_id: UUID, group: Group, session: SessionDep) -> Group:
    db_group = session.get(Group, group_id)
    if not db_group:
        raise HTTPException(
            status_code=404, detail="Group with {group_id} ID not found")
    group_data = group.model_dump(exclude_unset=True)
    db_group.sqlmodel_update(group_data)
    db_group.updated_at = datetime.now(timezone.utc)
    session.add(db_group)
    session.commit()
    session.refresh(db_group)
    return db_group


@router.delete("/{group_id}", tags=["groups"], response_model=dict)
async def delete_group(group_id: UUID, group: Group, session: SessionDep):
    db_group = session.get(Group, group_id)
    if not db_group:
        raise HTTPException(
            status_code=404, detail="Group with {group_id} ID not found")
    session.delete(db_group)
    session.commit()
    return {"ok": True}
