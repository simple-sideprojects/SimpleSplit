from fastapi import APIRouter, Depends
from app import config
from app.database.database import SessionDep
from app.database.models.user import User, UserResponse
from app.services.auth import AuthService, oauth2_scheme

router = APIRouter(
    prefix="/account",
    tags=["account"],
    dependencies=[Depends(oauth2_scheme)]
)


@router.get("/", response_model=UserResponse)
async def read_users_me(
    session: SessionDep,
    settings: config.Settings = Depends(config.get_settings),
    token: str = Depends(oauth2_scheme)
):
    user: User = await AuthService.get_current_user(session, token, settings)
    return UserResponse.model_construct(
        id=user.id,
        email=user.email,
        username=user.username,
        created_at=user.created_at,
        updated_at=user.updated_at
    )
