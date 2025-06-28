from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app import config
from app.routers import account, auth, balances, groups, invites, transactions
from app.database.database import create_db_and_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = config.get_settings()
    if settings.PROD != True:
        create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan)

print(config.get_settings().FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        config.get_settings().FRONTEND_URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(account.router)
app.include_router(auth.router)
app.include_router(balances.router)
app.include_router(groups.router)
app.include_router(invites.router)
app.include_router(transactions.router)
