from fastapi import APIRouter, Depends

from app.config import Settings, get_settings
from app.database.database import SessionDep
from app.database.models.balance import Balance
from app.services.auth import AuthService, oauth2_scheme
from app.services.balance import BalanceService

router = APIRouter(prefix="/balances", tags=["balances"])


@router.get("/", response_model=Balance)
async def get_user_balances(
    session: SessionDep,
    token: str = Depends(oauth2_scheme),
    settings: Settings = Depends(get_settings)
):
    current_user = await AuthService.get_current_user(session, token, settings)
    return BalanceService.calculate_balance(session, current_user.id)
