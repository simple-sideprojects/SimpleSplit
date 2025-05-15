from typing import Annotated
from fastapi import Depends
from sqlmodel import Session, SQLModel, create_engine
from app.config import get_settings

postgres_url = get_settings().DATABASE_URL
engine = create_engine(postgres_url)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]
