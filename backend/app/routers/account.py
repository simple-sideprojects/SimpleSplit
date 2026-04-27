from fastapi import APIRouter, Depends, HTTPException, status

from app.database.database import SessionDep
from app.database.models.user import UserInfoUpdate, UserResponse, UserUpdatePassword
from app.dependencies.auth import CurrentUser
from app.services.auth import AuthService, oauth2_scheme

router = APIRouter(
    prefix="/account",
    tags=["account"],
    dependencies=[Depends(oauth2_scheme)],
)


@router.get("/", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def read_users_me(current_user: CurrentUser) -> UserResponse:
    return UserResponse.model_validate(current_user, from_attributes=True)


@router.put("/", response_model=dict, status_code=status.HTTP_200_OK)
async def update_user_info(
    user_update: UserInfoUpdate,
    current_user: CurrentUser,
    session: SessionDep,
):
    current_user.username = user_update.username
    session.add(current_user)
    session.commit()
    session.refresh(current_user)

    return {"message": "User info updated successfully"}


@router.put("/password", response_model=dict, status_code=status.HTTP_200_OK)
async def update_password(
    user_update_password: UserUpdatePassword,
    current_user: CurrentUser,
    session: SessionDep,
):
    if not current_user.password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password not set")

    if not AuthService.verify_password(user_update_password.old_password, current_user.password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid old password")

    current_user.password = AuthService.get_password_hash(user_update_password.new_password)

    session.add(current_user)
    session.commit()
    session.refresh(current_user)

    return {"message": "Password updated successfully"}


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(current_user: CurrentUser, session: SessionDep):
    session.delete(current_user)
    session.commit()
