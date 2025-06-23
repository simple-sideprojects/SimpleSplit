from fastapi import FastAPI
from contextlib import asynccontextmanager

from app import config
from app.routers import account, auth, groups, invites, transactions
from app.database.database import create_db_and_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = config.get_settings()
    if settings.PROD != True:
        create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan)

app.include_router(account.router)
app.include_router(auth.router)
app.include_router(groups.router)
app.include_router(invites.router)
app.include_router(transactions.router)
