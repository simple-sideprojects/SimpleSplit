from sqlmodel import Session, SQLModel, create_engine

from .models.user import User

postgres_url = "postgresql://postgres:postgres@localhost:5432/postgres"

engine = create_engine(postgres_url)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session