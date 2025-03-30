from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security.oauth2 import OAuth2PasswordRequestForm
from sqlmodel import select

from app.database.database import SessionDep
from app.database.models.user import User, UserCreate, UserResponse
from app.database.models.auth import Token
from app.services.auth import AuthService
from app import config


router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate, session: SessionDep) -> UserResponse:
    statement = select(User).where(User.email == user.email)
    db_user = session.exec(statement).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    db_user = User(
        email=user.email,
        password=AuthService.get_password_hash(user.password),
        username=user.username
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)

    return UserResponse.model_construct(
        id=db_user.id,
        email=db_user.email,
        username=db_user.username,
        created_at=db_user.created_at,
        updated_at=db_user.updated_at
    )


@router.post("/login", response_model=Token)
async def login(
    session: SessionDep,
    login_data: OAuth2PasswordRequestForm = Depends(),
    settings: config.Settings = Depends(config.get_settings)
) -> Token:
    user = AuthService.authenticate_user(
        session, login_data.username, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = AuthService.create_access_token(
        data={
            "user": {
                "id": str(user.id),
                "email": user.email,
                "username": user.username
            }
        },
        expires_delta=access_token_expires,
        settings=settings
    )

    return Token(access_token=access_token, token_type="bearer")
