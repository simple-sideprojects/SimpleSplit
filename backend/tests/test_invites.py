import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select
from uuid import uuid4
from datetime import datetime

from app.database.models.invite import GroupInvite, GroupInviteCreate
from app.database.models.group import Group
from app.database.models.user import User
from app.database.models.users_groups import UsersGroups


class TestInviteEndpoints:
    """Integration tests for invite endpoints"""

    def test_generate_invite_link_success(self, client: TestClient, auth_headers: dict, test_group: Group, session: Session):
        """Test successful generation of invite link"""
        response = client.post(f"/invites/{test_group.id}/generate", headers=auth_headers)
        
        assert response.status_code == 201
        response_data = response.json()
        assert "token" in response_data
        assert len(response_data["token"]) > 0
        
        # Verify invite was created in database
        invite = session.exec(
            select(GroupInvite).where(GroupInvite.token == response_data["token"])
        ).first()
        assert invite is not None
        assert invite.group_id == test_group.id
        assert invite.email is None  # Link-based invites don't have email

    def test_invite_by_email_success(self, client: TestClient, auth_headers: dict, test_group: Group, test_user_2: User, session: Session):
        """Test successful email invitation"""
        invite_data = {
            "email": test_user_2.email
        }
        
        response = client.post(f"/invites/{test_group.id}/email", json=invite_data, headers=auth_headers)
        
        assert response.status_code == 201
        response_data = response.json()
        assert response_data["email"] == invite_data["email"]
        assert response_data["group_id"] == str(test_group.id)
        assert "token" in response_data
        assert "id" in response_data
        assert "created_at" in response_data

    def test_invite_by_email_user_not_found(self, client: TestClient, auth_headers: dict, test_group: Group):
        """Test email invitation fails when user doesn't exist"""
        invite_data = {
            "email": "nonexistent@example.com"
        }
        
        response = client.post(f"/invites/{test_group.id}/email", json=invite_data, headers=auth_headers)
        
        assert response.status_code == 404
        assert "User not found" in response.json()["detail"]

    def test_invite_by_email_already_member(self, client: TestClient, auth_headers: dict, test_group: Group, test_user: User):
        """Test email invitation fails when user is already a group member"""
        invite_data = {
            "email": test_user.email  # test_user is already in test_group
        }
        
        response = client.post(f"/invites/{test_group.id}/email", json=invite_data, headers=auth_headers)
        
        assert response.status_code == 400
        assert "User is already a member of this group" in response.json()["detail"]

    def test_invite_by_email_duplicate_invitation(self, client: TestClient, auth_headers: dict, test_group: Group, test_user_2: User, session: Session):
        """Test email invitation fails when invitation already exists"""
        # Create first invitation
        invite_data = {
            "email": test_user_2.email
        }
        
        response1 = client.post(f"/invites/{test_group.id}/email", json=invite_data, headers=auth_headers)
        assert response1.status_code == 201
        
        # Try to create duplicate invitation
        response2 = client.post(f"/invites/{test_group.id}/email", json=invite_data, headers=auth_headers)
        
        assert response2.status_code == 400
        assert "An invitation has already been sent to this email" in response2.json()["detail"]

    def test_get_my_invites_success(self, client: TestClient, auth_headers: dict, test_group: Group, test_user: User, session: Session):
        """Test getting list of invitations for current user"""
        # Create an invitation for the test user
        invite = GroupInvite(
            email=test_user.email,
            group_id=test_group.id,
            token="test-token-123"
        )
        session.add(invite)
        session.commit()
        
        response = client.get("/invites/my-invites", headers=auth_headers)
        
        assert response.status_code == 200
        invites = response.json()
        assert isinstance(invites, list)
        assert len(invites) > 0
        
        # Check the invite data
        found_invite = next((inv for inv in invites if inv["token"] == "test-token-123"), None)
        assert found_invite is not None
        assert found_invite["email"] == test_user.email
        assert found_invite["group_id"] == str(test_group.id)

    def test_accept_invite_success(self, client: TestClient, test_user_2: User, test_group: Group, session: Session, test_settings):
        """Test successful invitation acceptance"""
        # Create an invite for test_user_2
        invite = GroupInvite(
            email=test_user_2.email,
            group_id=test_group.id,
            token="accept-test-token"
        )
        session.add(invite)
        session.commit()
        
        # Create auth token for test_user_2
        from app.services.auth import AuthService
        from datetime import timedelta
        access_token_expires = timedelta(minutes=test_settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = AuthService.create_access_token(
            data={
                "user": {
                    "id": str(test_user_2.id),
                    "email": test_user_2.email,
                    "username": test_user_2.username
                }
            },
            expires_delta=access_token_expires,
            settings=test_settings
        )
        user_2_headers = {"Authorization": f"Bearer {access_token}"}
        
        response = client.put("/invites/accept/accept-test-token", headers=user_2_headers)
        
        assert response.status_code == 200
        assert "Invitation accepted successfully" in response.json()["message"]
        
        # Verify user was added to group
        membership = session.exec(
            select(UsersGroups).where(
                UsersGroups.user_id == test_user_2.id,
                UsersGroups.group_id == test_group.id
            )
        ).first()
        assert membership is not None
        
        # Verify email invite was deleted
        deleted_invite = session.exec(
            select(GroupInvite).where(GroupInvite.token == "accept-test-token")
        ).first()
        assert deleted_invite is None

    def test_accept_invite_invalid_token(self, client: TestClient, auth_headers: dict):
        """Test accepting invitation with invalid token"""
        response = client.put("/invites/accept/invalid-token", headers=auth_headers)
        
        assert response.status_code == 404
        assert "Invalid invitation" in response.json()["detail"]

    def test_accept_invite_wrong_email(self, client: TestClient, test_user: User, test_user_2: User, test_group: Group, session: Session, auth_headers: dict):
        """Test accepting invitation fails when email doesn't match"""
        # Create an invite for test_user_2 but try to accept with test_user
        invite = GroupInvite(
            email=test_user_2.email,  # Invite for user 2
            group_id=test_group.id,
            token="wrong-email-token"
        )
        session.add(invite)
        session.commit()
        
        # Try to accept with test_user (different email)
        response = client.put("/invites/accept/wrong-email-token", headers=auth_headers)
        
        assert response.status_code == 403
        assert "This invitation is for a different user" in response.json()["detail"]

    def test_reject_invite_success(self, client: TestClient, test_user: User, test_group: Group, session: Session, auth_headers: dict):
        """Test successful invitation rejection"""
        # Create an invite for test_user
        invite = GroupInvite(
            email=test_user.email,
            group_id=test_group.id,
            token="reject-test-token"
        )
        session.add(invite)
        session.commit()
        
        response = client.delete("/invites/reject/reject-test-token", headers=auth_headers)
        
        assert response.status_code == 204
        
        # Verify invite was deleted
        deleted_invite = session.exec(
            select(GroupInvite).where(GroupInvite.token == "reject-test-token")
        ).first()
        assert deleted_invite is None

    def test_reject_invite_invalid_token(self, client: TestClient, auth_headers: dict):
        """Test rejecting invitation with invalid token"""
        response = client.delete("/invites/reject/invalid-token", headers=auth_headers)
        
        assert response.status_code == 404
        assert "Invalid invitation" in response.json()["detail"]

    def test_invite_unauthorized_access(self, client: TestClient, test_group: Group):
        """Test that invite endpoints require authentication"""
        # Test without auth headers
        response = client.post(f"/invites/{test_group.id}/generate")
        assert response.status_code == 401
        
        response = client.get("/invites/my-invites")
        assert response.status_code == 401
        
        response = client.put("/invites/accept/some-token")
        assert response.status_code == 401 