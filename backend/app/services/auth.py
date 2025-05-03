from datetime import datetime, timedelta, timezone
import random
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
from app.database.models.user import User
from app.services.email import EmailService


pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


class AuthService:
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def get_password_hash(password: str) -> str:
        return pwd_context.hash(password)

    @staticmethod
    def authenticate_user(session: SessionDep, email: str, password: str) -> Optional[User]:
        statement = select(User).where(User.email == email)
        user = session.exec(statement).first()
        if not user:
            return None
        if not AuthService.verify_password(password, user.password):
            return None
        return user

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

    @staticmethod
    def get_random_token() -> int:
        return random.randint(100000, 999999)

    @staticmethod
    def verify_email_token(token: int, user: User) -> bool:
        return user.email_verification_token == token

    @staticmethod
    def send_confirm_email(email: str, frontend_url: str, token: int):
        email_service = EmailService()
        email_service.send_confirm_email(email, frontend_url, token)
