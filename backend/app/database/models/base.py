from sqlmodel import Field, SQLModel
from uuid import UUID, uuid4
from datetime import datetime
import sqlalchemy as sa

NOW_FACTORY = datetime.now


class BaseModel(SQLModel):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(
        default=None,
        sa_type=sa.DateTime(timezone=True),
        sa_column_kwargs={
            "server_default": sa.func.now()},
        nullable=False,
    )
    updated_at: datetime = Field(
        default=None,
        sa_type=sa.DateTime(timezone=True),
        sa_column_kwargs={
            "onupdate": sa.func.now(), "server_default": sa.func.now()},
    )
