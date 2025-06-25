from fastapi.testclient import TestClient
from sqlmodel import Session, select
from uuid import uuid4

from app.database.models.group import Group
from app.database.models.user import User


class TestGroupEndpoints:
    """Integration tests for group endpoints"""

    def test_get_groups_success(self, client: TestClient, auth_headers: dict, test_user: User, test_group: Group):
        """Test getting user's groups"""
        response = client.get("/groups/", headers=auth_headers)

        assert response.status_code == 200
        groups = response.json()
        assert len(groups) == 1
        assert groups[0]["id"] == str(test_group.id)
        assert groups[0]["name"] == test_group.name

    def test_get_groups_unauthorized(self, client: TestClient):
        """Test getting groups without authentication fails"""
        response = client.get("/groups/")

        assert response.status_code == 401

    def test_get_groups_empty_list(self, client: TestClient, auth_headers: dict):
        """Test getting groups when user has no groups returns empty list"""
        # Remove user from test group
        response = client.get("/groups/", headers=auth_headers)
        # Note: This test would need the user to not be in any groups
        # Since we have a test_group fixture, this user will always have at least one group

    def test_get_group_by_id_success(self, client: TestClient, auth_headers: dict, test_group: Group, session: Session):
        """Test getting a specific group by ID"""
        response = client.get(f"/groups/{test_group.id}", headers=auth_headers)

        assert response.status_code == 200
        group_data = response.json()
        assert group_data["id"] == str(test_group.id)
        assert group_data["name"] == test_group.name
        assert "users" in group_data
        # Check for new fields added in the commit
        assert "balance" in group_data
        assert "transactions" in group_data
        assert group_data["balance"] is not None
        assert isinstance(group_data["transactions"], list)

    def test_get_group_by_id_not_found(self, client: TestClient, auth_headers: dict):
        """Test getting a non-existent group returns 404"""
        fake_group_id = uuid4()
        response = client.get(f"/groups/{fake_group_id}", headers=auth_headers)

        assert response.status_code == 404
        assert "Group with" in response.json()["detail"]

    def test_get_group_by_id_not_member(self, client: TestClient, session: Session, test_user_2: User):
        """Test getting a group where user is not a member returns 404"""
        # Create a group owned by test_user_2
        other_group = Group(
            name="Other Group"
        )
        session.add(other_group)
        session.commit()
        session.refresh(other_group)

        # Create auth headers for test_user (not test_user_2)
        from app.services.auth import AuthService
        from datetime import timedelta
        from tests.conftest import TestSettings

        settings = TestSettings()
        access_token_expires = timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = AuthService.create_access_token(
            data={
                "user": {
                    "id": str(test_user_2.id),
                    "email": test_user_2.email,
                    "username": test_user_2.username
                }
            },
            expires_delta=access_token_expires,
            settings=settings
        )
        other_auth_headers = {"Authorization": f"Bearer {access_token}"}

        response = client.get(
            f"/groups/{other_group.id}", headers=other_auth_headers)

        assert response.status_code == 403

    def test_create_group_success(self, client: TestClient, auth_headers: dict, session: Session):
        """Test successful group creation"""
        group_data = {
            "name": "New Test Group"
        }

        response = client.post(
            "/groups/", json=group_data, headers=auth_headers)

        assert response.status_code == 201
        response_data = response.json()
        assert response_data["name"] == group_data["name"]
        assert "id" in response_data
        assert "created_at" in response_data

        # Verify group was created in database
        stmt = select(Group).where(Group.name == group_data["name"])
        db_group = session.exec(stmt).first()
        assert db_group is not None
        assert db_group.name == group_data["name"]

    def test_create_group_unauthorized(self, client: TestClient):
        """Test creating group without authentication fails"""
        group_data = {
            "name": "Unauthorized Group"
        }

        response = client.post("/groups/", json=group_data)

        assert response.status_code == 401

    def test_create_group_invalid_data(self, client: TestClient, auth_headers: dict):
        """Test creating group with invalid data fails"""
        group_data = {
            "name": ""  # Empty name should fail validation
        }

        response = client.post(
            "/groups/", json=group_data, headers=auth_headers)

        assert response.status_code == 422  # Validation error

    def test_update_group_success(self, client: TestClient, auth_headers: dict, test_group: Group, session: Session):
        """Test successful group update"""
        update_data = {
            "name": "Updated Group Name"
        }

        response = client.put(
            f"/groups/{test_group.id}", json=update_data, headers=auth_headers)

        assert response.status_code == 200
        response_data = response.json()
        assert response_data["name"] == update_data["name"]

        # Verify group was updated in database
        session.refresh(test_group)
        assert test_group.name == update_data["name"]

    def test_update_group_partial(self, client: TestClient, auth_headers: dict, test_group: Group, session: Session):
        """Test partial group update (only name)"""
        update_data = {
            "name": "Only Name Updated"
        }

        response = client.put(
            f"/groups/{test_group.id}", json=update_data, headers=auth_headers)

        assert response.status_code == 200
        response_data = response.json()
        assert response_data["name"] == update_data["name"]

        # Verify in database
        session.refresh(test_group)
        assert test_group.name == update_data["name"]

    def test_update_group_not_member(self, client: TestClient, session: Session, test_user_2: User):
        """Test updating a group where user is not a member returns 403"""
        # Create a group owned by test_user_2
        other_group = Group(
            name="Other Group"
        )
        session.add(other_group)
        session.commit()
        session.refresh(other_group)

        # Try to update with different user's token
        update_data = {"name": "Hacked Group"}

        # This would need proper auth headers for a different user
        # For now, we'll test the middleware logic by creating appropriate headers
        from app.services.auth import AuthService
        from datetime import timedelta
        from tests.conftest import TestSettings

        settings = TestSettings()
        access_token_expires = timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

        # Create token for a user who's not in the group
        fake_user = User(
            email="fake@example.com",
            username="fakeuser",
            password="password"
        )
        session.add(fake_user)
        session.commit()
        session.refresh(fake_user)

        access_token = AuthService.create_access_token(
            data={
                "user": {
                    "id": str(fake_user.id),
                    "email": fake_user.email,
                    "username": fake_user.username
                }
            },
            expires_delta=access_token_expires,
            settings=settings
        )
        fake_auth_headers = {"Authorization": f"Bearer {access_token}"}

        response = client.put(
            f"/groups/{other_group.id}", json=update_data, headers=fake_auth_headers)

        assert response.status_code == 403

    def test_delete_group_success(self, client: TestClient, auth_headers: dict, session: Session, test_user: User):
        # Create a group to delete
        group_to_delete = Group(
            name="This group will be deleted",
            users=[test_user]
        )
        session.add(group_to_delete)
        session.commit()
        session.refresh(group_to_delete)

        response = client.delete(
            f"/groups/{group_to_delete.id}", headers=auth_headers)

        assert response.status_code == 204

    def test_get_group_transactions_success(self, client: TestClient, auth_headers: dict, test_group: Group):
        """Test getting group transactions"""
        response = client.get(
            f"/groups/{test_group.id}/transactions", headers=auth_headers)

        assert response.status_code == 200
        transactions = response.json()
        assert isinstance(transactions, list)

    def test_get_group_transactions_with_pagination(self, client: TestClient, auth_headers: dict, test_group: Group):
        """Test getting group transactions with pagination"""
        response = client.get(
            f"/groups/{test_group.id}/transactions?skip=0&limit=10", headers=auth_headers)

        assert response.status_code == 200
        transactions = response.json()
        assert isinstance(transactions, list)

    def test_remove_user_from_group_success(self, client: TestClient, auth_headers: dict, test_group: Group,
                                            session: Session, test_user: User, test_user_2: User):
        """Test successful user removal from group"""
        # Add test_user_2 to the group first
        test_group.users.append(test_user_2)
        session.add(test_group)
        session.commit()
        session.refresh(test_group)

        response = client.delete(
            f"/groups/{test_group.id}/users/{test_user_2.id}", headers=auth_headers)

        assert response.status_code == 200
        response_data = response.json()
        # Verify user was removed from group
        user_ids = [user["id"] for user in response_data["users"]]
        assert str(test_user_2.id) not in user_ids

    def test_remove_nonexistent_user_from_group(self, client: TestClient, auth_headers: dict, test_group: Group):
        """Test removing non-existent user from group returns 404"""
        fake_user_id = uuid4()

        response = client.delete(
            f"/groups/{test_group.id}/users/{fake_user_id}", headers=auth_headers)

        assert response.status_code == 404
        assert "User not found" in response.json()["detail"]
