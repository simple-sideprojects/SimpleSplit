from fastapi import APIRouter, Depends

from app.database.database import SessionDep
from app.database.models.balance import Balance
from app.dependencies.auth import CurrentUser
from app.services.auth import oauth2_scheme
from app.services.balance import BalanceService

router = APIRouter(prefix="/balances", tags=["balances"], dependencies=[Depends(oauth2_scheme)])


@router.get("/", response_model=Balance)
async def get_user_balances(session: SessionDep, current_user: CurrentUser):
    return BalanceService.calculate_balance(session, current_user.id)
