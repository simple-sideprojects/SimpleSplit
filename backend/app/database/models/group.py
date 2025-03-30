from sqlmodel import Field, SQLModel
from app.database.models.base import BaseModel

class Group(BaseModel, table=True):
    __tablename__ = "groups"
    name: str = Field(index=True)

class CreateGroup(SQLModel):
    name: str = Field(index=True)
    
