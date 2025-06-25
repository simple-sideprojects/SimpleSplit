import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool
from typing import Generator
from datetime import timedelta

from app.main import app
from app.database.database import get_session
from app.config import get_settings, Settings
from app.services.auth import AuthService
from app.database.models import *


class TestSettings(Settings):
    """Test settings that override production settings"""
    PROD: bool = False
    FRONTEND_URL: str = "http://localhost:3000"
    DATABASE_URL: str = "sqlite:///test.db"

    # Auth Settings
    SECRET_KEY: str = "test-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # SMTP Settings (disabled for tests)
    SMTP_SERVER: str = "localhost"
    SMTP_PORT: int = 587
    SMTP_USER: str = "test@example.com"
    SMTP_PASSWORD: str = "test"
    SMTP_USE_TLS: bool = False
    SENDER_EMAIL: str = "test@example.com"
    # Disable email verification for tests
    EMAIL_ACCOUNT_VERIFICATION: bool = False

    class Config:
        env_file = None  # Don't load from .env in tests


@pytest.fixture(name="test_settings")
def test_settings_fixture():
    """Override settings for testing"""
    return TestSettings()


@pytest.fixture(name="engine")
def engine_fixture():
    """Create an in-memory SQLite database for testing"""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    return engine


@pytest.fixture(name="session")
def session_fixture(engine) -> Generator[Session, None, None]:
    """Create a database session for testing"""
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session, test_settings: TestSettings) -> Generator[TestClient, None, None]:
    """Create a test client with overridden dependencies"""
    def get_session_override():
        return session

    def get_settings_override():
        return test_settings

    app.dependency_overrides[get_session] = get_session_override
    app.dependency_overrides[get_settings] = get_settings_override

    client = TestClient(app)
    yield client

    # Clean up
    app.dependency_overrides.clear()


@pytest.fixture(name="test_user")
def test_user_fixture(session: Session, test_settings: TestSettings) -> User:
    """Create a test user in the database"""
    user_data = UserCreate(
        email="test@example.com",
        username="testuser",
        password="testpassword123"
    )

    hashed_password = AuthService.get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        username=user_data.username,
        password=hashed_password,
        email_verified=True  # Skip email verification for tests
    )

    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


@pytest.fixture(name="test_user_2")
def test_user_2_fixture(session: Session, test_settings: TestSettings) -> User:
    """Create a second test user in the database"""
    user_data = UserCreate(
        email="test2@example.com",
        username="testuser2",
        password="testpassword123"
    )

    hashed_password = AuthService.get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        username=user_data.username,
        password=hashed_password,
        email_verified=True
    )

    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


@pytest.fixture(name="auth_token")
def auth_token_fixture(test_user: User, test_settings: TestSettings) -> str:
    """Create an authentication token for the test user"""
    access_token_expires = timedelta(
        minutes=test_settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = AuthService.create_access_token(
        data={
            "user": {
                "id": str(test_user.id),
                "email": test_user.email,
                "username": test_user.username
            }
        },
        expires_delta=access_token_expires,
        settings=test_settings
    )
    return access_token


@pytest.fixture(name="auth_headers")
def auth_headers_fixture(auth_token: str) -> dict:
    """Create authorization headers with the test user's token"""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture(name="test_group")
def test_group_fixture(session: Session, test_user: User) -> Group:
    """Create a test group with the test user as a member"""
    db_group = Group(
        name="Test Group"
    )

    # Add the test user to the group
    db_group.users.append(test_user)

    session.add(db_group)
    session.commit()
    session.refresh(db_group)
    return db_group
