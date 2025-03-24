from uuid import UUID
from fastapi import APIRouter, HTTPException

from app.database.database import SessionDep
from app.database.models.group import CreateGroup, Group

router = APIRouter(
    prefix="/groups"
)

@router.get("/", tags=["groups"])
async def read_groups():
    return [{"name": "Road Trip 2025"}, {"name": "Road Trip 2024"}]

@router.post("/", tags=["groups"])
async def create_group(group: CreateGroup, session: SessionDep) -> Group:
    db_group = Group.model_validate(group)
    session.add(db_group)
    session.commit()
    session.refresh(db_group)
    return db_group

@router.put("/{group_id}", tags=["groups"])
async def update_group(group_id: UUID, group: Group, session: SessionDep) -> Group:
    db_group = session.get(Group, group_id)
    if not db_group:
        raise HTTPException(status_code=404, detail="Group with {group_id} ID not found")
    group_data = group.model_dump(exclude_unset=True)
    db_group.sqlmodel_update(group_data)
    session.add(db_group)
    session.commit()
    session.refresh(db_group)
    return db_group