import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.database.models.user import User


class TestAccountEndpoints:
    """Integration tests for account endpoints"""

    def test_get_user_profile_success(self, client: TestClient, auth_headers: dict, test_user: User):
        """Test getting user profile successfully"""
        response = client.get("/account/", headers=auth_headers)
        
        assert response.status_code == 200
        user_data = response.json()
        assert user_data["id"] == str(test_user.id)
        assert user_data["email"] == test_user.email
        assert user_data["username"] == test_user.username
        assert "created_at" in user_data
        assert "updated_at" in user_data

    def test_get_user_profile_unauthorized(self, client: TestClient):
        """Test getting user profile without authentication fails"""
        response = client.get("/account/")
        
        assert response.status_code == 401

    def test_update_user_profile_success(self, client: TestClient, auth_headers: dict, test_user: User, session: Session):
        """Test successful user profile update"""
        update_data = {
            "username": "updated_username"
        }
        
        response = client.put("/account/", json=update_data, headers=auth_headers)
        
        assert response.status_code == 200
        response_data = response.json()
        assert response_data["message"] == "User info updated successfully"
        
        # Verify user was updated in database
        session.refresh(test_user)
        assert test_user.username == update_data["username"]

    def test_update_user_profile_partial(self, client: TestClient, auth_headers: dict, test_user: User, session: Session):
        """Test partial user profile update (only username)"""
        original_email = test_user.email
        update_data = {
            "username": "only_username_updated"
        }
        
        response = client.put("/account/", json=update_data, headers=auth_headers)
        
        assert response.status_code == 200
        response_data = response.json()
        assert response_data["message"] == "User info updated successfully"
        
        # Verify in database
        session.refresh(test_user)
        assert test_user.username == update_data["username"]
        assert test_user.email == original_email

    def test_update_user_profile_invalid_data(self, client: TestClient, auth_headers: dict):
        """Test updating user profile with invalid data fails"""
        update_data = {
            "username": ""  # Empty username should fail validation
        }
        
        response = client.put("/account/", json=update_data, headers=auth_headers)
        
        assert response.status_code == 422  # Validation error

    def test_change_password_success(self, client: TestClient, auth_headers: dict, test_user: User, session: Session):
        """Test successful password change"""
        password_data = {
            "old_password": "testpassword123",  # Current password from fixture
            "new_password": "newpassword456"
        }
        
        response = client.put("/account/password", json=password_data, headers=auth_headers)
        
        assert response.status_code == 200
        
        # Verify password was changed by trying to login with new password
        login_data = {
            "username": test_user.email,
            "password": password_data["new_password"]
        }
        
        login_response = client.post("/auth/login", data=login_data)
        assert login_response.status_code == 200

    def test_change_password_wrong_old_password(self, client: TestClient, auth_headers: dict):
        """Test password change with wrong old password fails"""
        password_data = {
            "old_password": "wrongpassword",
            "new_password": "newpassword456"
        }
        
        response = client.put("/account/password", json=password_data, headers=auth_headers)
        
        assert response.status_code == 400
        assert "Invalid old password" in response.json()["detail"]

    def test_change_password_unauthorized(self, client: TestClient):
        """Test changing password without authentication fails"""
        password_data = {
            "old_password": "testpassword123",
            "new_password": "newpassword456"
        }
        
        response = client.put("/account/password", json=password_data)
        
        assert response.status_code == 401

    def test_delete_account_success(self, client: TestClient, auth_headers: dict, test_user: User, session: Session):
        """Test successful account deletion"""
        response = client.delete("/account/", headers=auth_headers)
        
        assert response.status_code == 204

    def test_delete_account_unauthorized(self, client: TestClient):
        """Test deleting account without authentication fails"""
        response = client.delete("/account/")
        
        assert response.status_code == 401 