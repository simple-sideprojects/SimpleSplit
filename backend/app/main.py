import os
from fastapi import Depends, FastAPI
from contextlib import asynccontextmanager
from .routers import users
from .database.database import create_db_and_tables, engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    if os.getenv("PROD") != "true":
        create_db_and_tables()
    yield
    await engine.dispose()

app = FastAPI(lifespan=lifespan)

app.include_router(users.router)


@app.get("/")
async def root():
    return {"message": "Hello Bigger Applications!"}