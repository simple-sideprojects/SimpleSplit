from fastapi import APIRouter, Depends, HTTPException
from app import config
from app.database.database import SessionDep
from app.database.models.user import User, UserInfoUpdate, UserResponse, UserUpdatePassword
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


@router.put("/", response_model=dict)
async def update_user_info(
    user_update: UserInfoUpdate,
    session: SessionDep,
    settings: config.Settings = Depends(config.get_settings),
    token: str = Depends(oauth2_scheme)
):
    user: User = await AuthService.get_current_user(session, token, settings)
    user.username = user_update.username
    session.add(user)
    session.commit()
    session.refresh(user)

    return {"message": "User info updated successfully"}


@router.put("/password", response_model=dict)
async def update_password(
    user_update_password: UserUpdatePassword,
    session: SessionDep,
    settings: config.Settings = Depends(config.get_settings),
    token: str = Depends(oauth2_scheme)
):
    user: User = await AuthService.get_current_user(session, token, settings)

    if not user.password:
        raise HTTPException(status_code=400, detail="Password not set")

    if not AuthService.verify_password(user.password, user_update_password.old_password):
        raise HTTPException(status_code=400, detail="Invalid old password")

    user.password = AuthService.get_password_hash(
        user_update_password.new_password)

    session.add(user)
    session.commit()
    session.refresh(user)

    return {"message": "Password updated successfully"}


@router.delete("/", response_model=dict)
async def delete_user(
    session: SessionDep,
    settings: config.Settings = Depends(config.get_settings),
    token: str = Depends(oauth2_scheme)
):
    user: User = await AuthService.get_current_user(session, token, settings)
    session.delete(user)
    session.commit()
    return {"message": "User deleted successfully"}
