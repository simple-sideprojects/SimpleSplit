from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status

from app.database.database import SessionDep
from app.database.models.group import Group
from app.dependencies.auth import CurrentUser


async def is_user_in_group(
    group_id: str | UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Group:
    try:
        group_uuid = UUID(group_id) if isinstance(group_id, str) else group_id
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid group ID format"
        )

    db_group = session.get(Group, group_uuid)
    if not db_group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Group with {group_id} ID not found"
        )

    if current_user not in db_group.users:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="User is not a member of this group"
        )

    return db_group


GroupMembership = Annotated[Group, Depends(is_user_in_group)]
