from typing import Annotated
from fastapi import APIRouter, Depends
from sqlmodel import select
from app import config
from app.database.database import SessionDep
from app.database.models.group import CreateGroup, Group
from app.database.models.user import User
from app.services.auth import AuthService, oauth2_scheme
from app.middleware.is_user_group import is_user_in_group

router = APIRouter(
    prefix="/groups",
    tags=["groups"],
    dependencies=[Depends(oauth2_scheme)]
)


@router.get("/", tags=["groups"], response_model=list[Group])
async def read_groups(session: SessionDep, token: Annotated[str, Depends(oauth2_scheme)], settings: Annotated[config.Settings, Depends(config.get_settings)]) -> list[Group]:
    user = await AuthService.get_current_user(session, token, settings)
    statement = select(User).where(User.id == user.id)

    groups = session.exec(statement).first().groups

    return groups


@router.post("/", tags=["groups"], response_model=Group)
async def create_group(group: CreateGroup, session: SessionDep, token: Annotated[str, Depends(oauth2_scheme)], settings: Annotated[config.Settings, Depends(config.get_settings)]) -> Group:
    user = await AuthService.get_current_user(session, token, settings)
    statement = select(User).where(User.id == user.id)
    user = session.exec(statement).first()

    db_group = Group.model_validate(group)
    db_group.users.append(user)

    session.add(db_group)
    session.commit()
    session.refresh(db_group)

    return db_group


@router.put("/{group_id}", tags=["groups"], response_model=Group)
async def update_group(
    group: Group,
    session: SessionDep,
    db_group: Annotated[Group, Depends(is_user_in_group)]
) -> Group:
    group_data = group.model_dump(exclude_unset=True)
    db_group.sqlmodel_update(group_data)

    session.add(db_group)
    session.commit()
    session.refresh(db_group)

    return db_group


@router.delete("/{group_id}", tags=["groups"], response_model=dict)
async def delete_group(
    session: SessionDep,
    db_group: Annotated[Group, Depends(is_user_in_group)]
):
    session.delete(db_group)
    session.commit()
    return {"message": "Group deleted successfully"}
