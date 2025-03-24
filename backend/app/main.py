import os
from fastapi import Depends, FastAPI
from contextlib import asynccontextmanager

from .routers import groups, users
from .database.database import create_db_and_tables, engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    if os.getenv("PROD") != "true":
        create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan)

app.include_router(users.router)
app.include_router(groups.router)


@app.get("/")
async def root():
    return {"message": "Hello Bigger Applications!"}