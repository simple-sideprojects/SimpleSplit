from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import config
from app.database.database import create_db_and_tables
from app.exceptions import register_exception_handlers
from app.logging_config import RequestIdMiddleware, configure_logging
from app.routers import account, auth, balances, groups, invites, transactions


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    settings = config.get_settings()
    if settings.PROD is not True:
        create_db_and_tables()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(RequestIdMiddleware)

_settings = config.get_settings()
_allowed_origins = [
    _settings.FRONTEND_URL,
    # Capacitor apps talk to the API directly; these are the WebView origins.
    "capacitor://localhost",
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:4173",
    "http://localhost:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(account.router)
app.include_router(auth.router)
app.include_router(balances.router)
app.include_router(groups.router)
app.include_router(invites.router)
app.include_router(transactions.router)
