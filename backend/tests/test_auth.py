import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.database.models.user import User


class TestAuthEndpoints:
    """Integration tests for authentication endpoints"""

    def test_register_success(self, client: TestClient, session: Session):
        """Test successful user registration"""
        user_data = {
            "email": "newuser@example.com",
            "username": "newuser",
            "password": "newpassword123"
        }
        
        response = client.post("/auth/register", json=user_data)
        
        assert response.status_code == 201
        response_data = response.json()
        assert response_data["email"] == user_data["email"]
        assert response_data["username"] == user_data["username"]
        assert "id" in response_data
        assert "created_at" in response_data
        assert "updated_at" in response_data
        
        # Verify user was created in database
        stmt = select(User).where(User.email == user_data["email"])
        db_user = session.exec(stmt).first()
        assert db_user is not None
        assert db_user.email == user_data["email"]
        assert db_user.username == user_data["username"]
        assert db_user.email_verified is True  # Should be True due to test settings

    def test_register_duplicate_email(self, client: TestClient, test_user: User):
        """Test registration with duplicate email fails"""
        user_data = {
            "email": test_user.email,  # Use existing user's email
            "username": "differentusername",
            "password": "password123"
        }
        
        response = client.post("/auth/register", json=user_data)
        
        assert response.status_code == 400
        assert "Email already registered" in response.json()["detail"]

    def test_register_invalid_data(self, client: TestClient):
        """Test registration with invalid data fails"""
        user_data = {
            "email": "invalid-email",  # Invalid email format
            "username": "user",
            "password": "short"  # Too short password
        }
        
        response = client.post("/auth/register", json=user_data)
        
        assert response.status_code == 422  # Validation error

    def test_login_success(self, client: TestClient, test_user: User):
        """Test successful login"""
        login_data = {
            "username": test_user.email,
            "password": "testpassword123"  # Password from test fixture
        }
        
        response = client.post("/auth/login", data=login_data)
        
        assert response.status_code == 200
        response_data = response.json()
        assert "access_token" in response_data
        assert response_data["token_type"] == "bearer"

    def test_login_invalid_credentials(self, client: TestClient, test_user: User):
        """Test login with invalid credentials fails"""
        login_data = {
            "username": test_user.email,
            "password": "wrongpassword"
        }
        
        response = client.post("/auth/login", data=login_data)
        
        assert response.status_code == 401
        assert "Incorrect email or password" in response.json()["detail"]

    def test_login_nonexistent_user(self, client: TestClient):
        """Test login with non-existent user fails"""
        login_data = {
            "username": "nonexistent@example.com",
            "password": "somepassword"
        }
        
        response = client.post("/auth/login", data=login_data)
        
        assert response.status_code == 401
        assert "Incorrect email or password" in response.json()["detail"]

    def test_confirm_email_success(self, client: TestClient, session: Session):
        """Test successful email confirmation"""
        # Create user with email verification token
        user = User(
            email="unverified@example.com",
            username="unverified",
            password="hashedpassword",
            email_verified=False,
            email_verification_token=123456
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        
        confirmation_data = {
            "frontend_url": "http://localhost:3000",
            "token": 123456
        }
        
        response = client.post("/auth/confirm-email", json=confirmation_data)
        
        assert response.status_code == 200
        response_data = response.json()
        assert "access_token" in response_data
        assert response_data["token_type"] == "bearer"
        
        # Verify user was verified in database
        session.refresh(user)
        assert user.email_verified == True
        assert user.email_verification_token == None

    def test_confirm_email_invalid_token(self, client: TestClient):
        """Test email confirmation with invalid token fails"""
        confirmation_data = {
            "frontend_url": "http://localhost:3000",
            "token": 999999  # Non-existent token
        }
        
        response = client.post("/auth/confirm-email", json=confirmation_data)
        
        assert response.status_code == 404
        assert "User not found" in response.json()["detail"] 