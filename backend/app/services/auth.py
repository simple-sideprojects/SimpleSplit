from datetime import datetime, timedelta, timezone
from fastapi.security import OAuth2PasswordBearer
import jwt
from jwt.exceptions import InvalidTokenError
from typing import Annotated, Optional
from fastapi import Depends, HTTPException, status
from passlib.context import CryptContext
from sqlmodel import select
from app import config
from app.database.database import SessionDep
from app.database.models.auth import JWTPayload
from app.database.models.user import User, UserResponse


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


class AuthService:
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def get_password_hash(password: str) -> str:
        return pwd_context.hash(password)

    @staticmethod
    def authenticate_user(session: SessionDep, email: str, password: str) -> Optional[UserResponse]:
        statement = select(User).where(User.email == email)
        user = session.exec(statement).first()
        if not user:
            return None
        if not AuthService.verify_password(password, user.password):
            return None
        return UserResponse.model_construct(
            id=user.id,
            email=user.email,
            username=user.username,
            created_at=user.created_at,
            updated_at=user.updated_at
        )

    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta], settings: Annotated[config.Settings, Depends(config.get_settings)]) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        encoded_jwt: str = jwt.encode(
            to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt

    @staticmethod
    async def get_jwt_payload(
        token: str,
        settings: config.Settings
    ) -> JWTPayload:
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        try:
            payload: JWTPayload | None = jwt.decode(token, settings.SECRET_KEY,
                                                    algorithms=[settings.ALGORITHM])
        except InvalidTokenError:
            raise credentials_exception

        return payload

    @staticmethod
    async def get_current_user(
        session: SessionDep,
        token: str,
        settings: config.Settings
    ) -> User:
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        jwt_payload = await AuthService.get_jwt_payload(token, settings)
        statement = select(User).where(
            User.id == jwt_payload.get("user").get("id"))
        user = session.exec(statement).first()
        if user is None:
            raise credentials_exception
        return user
