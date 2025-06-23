from fastapi import HTTPException, Depends, status
from sqlmodel import select
from app.database.database import SessionDep
from app.database.models.group import Group
from app.database.models.user import User
from app.services.auth import AuthService, oauth2_scheme
from app import config
from typing import Annotated
from uuid import UUID


async def is_user_in_group(
    group_id: str,
    session: SessionDep,
    token: Annotated[str, Depends(oauth2_scheme)],
    settings: Annotated[config.Settings, Depends(config.get_settings)]
) -> Group:
    user = await AuthService.get_current_user(session, token, settings)
    statement = select(User).where(User.id == user.id)
    user = session.exec(statement).first()

    try:
        group_uuid = UUID(group_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid group ID format")

    db_group = session.get(Group, group_uuid)
    if not db_group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Group with {group_id} ID not found")

    if user not in db_group.users:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="User is not a member of this group")

    return db_group
