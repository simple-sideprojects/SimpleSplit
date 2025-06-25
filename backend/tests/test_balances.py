from fastapi.testclient import TestClient
from sqlmodel import Session

from app.database.models.group import Group
from app.database.models.user import User
from app.database.models.transaction import Transaction, TransactionType
from app.database.models.transaction_participant import TransactionParticipant


class TestBalanceEndpoints:
    """Integration tests for balance endpoints"""

    def test_get_balances_empty_success(self, client: TestClient, auth_headers: dict, test_user: User):
        """Test getting user balances when user has no transactions"""
        response = client.get("/balances/", headers=auth_headers)

        assert response.status_code == 200
        balance_data = response.json()
        assert balance_data["user_id"] == str(test_user.id)
        assert balance_data["group_id"] is None
        assert balance_data["total_balance"] == 0
        assert balance_data["total_owed_by_others"] == 0
        assert balance_data["total_owed_to_others"] == 0
        assert balance_data["user_balances"] == []

    def test_get_balances_unauthorized(self, client: TestClient):
        """Test getting balances without authentication fails"""
        response = client.get("/balances/")

        assert response.status_code == 401

    def test_get_balances_with_transactions(self, client: TestClient, auth_headers: dict,
                                            test_user: User, test_user_2: User, test_group: Group,
                                            session: Session):
        """Test getting user balances when user has transactions"""
        # Add test_user_2 to the group
        test_group.users.append(test_user_2)
        session.add(test_group)
        session.commit()
        session.refresh(test_group)

        # Create a transaction where test_user paid and test_user_2 owes
        transaction = Transaction(
            amount=2000,  # $20.00 in cents
            title="Test transaction",
            transaction_type=TransactionType.EVEN,
            group_id=test_group.id,
            payer_id=test_user.id
        )
        session.add(transaction)
        session.commit()
        session.refresh(transaction)

        # Create transaction participant (test_user_2 owes test_user)
        participant = TransactionParticipant(
            transaction_id=transaction.id,
            debtor_id=test_user_2.id,
            amount_owed=1000  # $10.00 in cents (half of the transaction)
        )
        session.add(participant)
        session.commit()

        response = client.get("/balances/", headers=auth_headers)

        assert response.status_code == 200
        balance_data = response.json()
        assert balance_data["user_id"] == str(test_user.id)
        assert balance_data["group_id"] is None
        # test_user is owed $10.00
        assert balance_data["total_balance"] == 1000
        assert balance_data["total_owed_by_others"] == 1000
        assert balance_data["total_owed_to_others"] == 0
        assert len(balance_data["user_balances"]) == 1

    def test_get_balances_user_owes_money(self, client: TestClient, session: Session,
                                          test_user: User, test_user_2: User, test_group: Group):
        """Test getting balances when user owes money to others"""
        # Add test_user_2 to the group
        test_group.users.append(test_user_2)
        session.add(test_group)
        session.commit()
        session.refresh(test_group)

        # Create auth headers for test_user_2
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
        user2_auth_headers = {"Authorization": f"Bearer {access_token}"}

        # Create a transaction where test_user paid and test_user_2 owes
        transaction = Transaction(
            amount=3000,  # $30.00 in cents
            title="Test transaction for debt",
            transaction_type=TransactionType.EVEN,
            group_id=test_group.id,
            payer_id=test_user.id
        )
        session.add(transaction)
        session.commit()
        session.refresh(transaction)

        # Create transaction participant (test_user_2 owes test_user)
        participant = TransactionParticipant(
            transaction_id=transaction.id,
            debtor_id=test_user_2.id,
            amount_owed=1500  # $15.00 in cents (half of the transaction)
        )
        session.add(participant)
        session.commit()

        # Check balance from test_user_2's perspective (they owe money)
        response = client.get("/balances/", headers=user2_auth_headers)

        assert response.status_code == 200
        balance_data = response.json()
        assert balance_data["user_id"] == str(test_user_2.id)
        assert balance_data["total_balance"] == - \
            1500  # test_user_2 owes $15.00
        assert balance_data["total_owed_by_others"] == 0
        assert balance_data["total_owed_to_others"] == 1500

    def test_get_balances_complex_scenario(self, client: TestClient, auth_headers: dict, session: Session,
                                           test_user: User, test_user_2: User, test_group: Group):
        """Test getting balances with multiple transactions in both directions"""
        # Add test_user_2 to the group
        test_group.users.append(test_user_2)
        session.add(test_group)
        session.commit()
        session.refresh(test_group)

        # Transaction 1: test_user paid $40, test_user_2 owes $20
        transaction1 = Transaction(
            amount=4000,
            title="First transaction",
            transaction_type=TransactionType.EVEN,
            group_id=test_group.id,
            payer_id=test_user.id
        )
        session.add(transaction1)
        session.commit()
        session.refresh(transaction1)

        participant1 = TransactionParticipant(
            transaction_id=transaction1.id,
            debtor_id=test_user_2.id,
            amount_owed=2000
        )
        session.add(participant1)

        # Transaction 2: test_user_2 paid $30, test_user owes $15
        transaction2 = Transaction(
            amount=3000,
            title="Second transaction",
            transaction_type=TransactionType.EVEN,
            group_id=test_group.id,
            payer_id=test_user_2.id
        )
        session.add(transaction2)
        session.commit()
        session.refresh(transaction2)

        participant2 = TransactionParticipant(
            transaction_id=transaction2.id,
            debtor_id=test_user.id,
            amount_owed=1500
        )
        session.add(participant2)
        session.commit()

        response = client.get("/balances/", headers=auth_headers)

        assert response.status_code == 200
        balance_data = response.json()
        assert balance_data["user_id"] == str(test_user.id)
        # test_user is owed $20 but owes $15, so net balance is $5
        assert balance_data["total_balance"] == 500
        assert balance_data["total_owed_by_others"] == 2000
        assert balance_data["total_owed_to_others"] == 1500

    def test_get_balances_multiple_groups(self, client: TestClient, auth_headers: dict, session: Session,
                                          test_user: User, test_user_2: User, test_group: Group):
        """Test getting balances across multiple groups"""
        # Create a second group
        group2 = Group(name="Second Test Group")
        group2.users.append(test_user)
        group2.users.append(test_user_2)
        session.add(group2)
        session.commit()
        session.refresh(group2)

        # Add test_user_2 to first group as well
        test_group.users.append(test_user_2)
        session.add(test_group)
        session.commit()
        session.refresh(test_group)

        # Transaction in first group
        transaction1 = Transaction(
            amount=2000,
            title="Group 1 transaction",
            transaction_type=TransactionType.EVEN,
            group_id=test_group.id,
            payer_id=test_user.id
        )
        session.add(transaction1)
        session.commit()
        session.refresh(transaction1)

        participant1 = TransactionParticipant(
            transaction_id=transaction1.id,
            debtor_id=test_user_2.id,
            amount_owed=1000
        )
        session.add(participant1)

        # Transaction in second group
        transaction2 = Transaction(
            amount=1000,
            title="Group 2 transaction",
            transaction_type=TransactionType.EVEN,
            group_id=group2.id,
            payer_id=test_user.id
        )
        session.add(transaction2)
        session.commit()
        session.refresh(transaction2)

        participant2 = TransactionParticipant(
            transaction_id=transaction2.id,
            debtor_id=test_user_2.id,
            amount_owed=500
        )
        session.add(participant2)
        session.commit()

        response = client.get("/balances/", headers=auth_headers)

        assert response.status_code == 200
        balance_data = response.json()
        assert balance_data["user_id"] == str(test_user.id)
        assert balance_data["group_id"] is None  # All groups combined
        # Total owed by others: $10 + $5 = $15
        assert balance_data["total_owed_by_others"] == 1500
        assert balance_data["total_owed_to_others"] == 0
        assert balance_data["total_balance"] == 1500

    def test_get_balances_no_debt_relationships(self, client: TestClient, auth_headers: dict, session: Session,
                                                test_user: User, test_user_2: User, test_group: Group):
        """Test getting balances when user only pays for themselves"""
        # Add test_user_2 to the group
        test_group.users.append(test_user_2)
        session.add(test_group)
        session.commit()
        session.refresh(test_group)

        # Create a transaction where test_user paid but also owes the full amount (pays for themselves)
        transaction = Transaction(
            amount=1000,
            title="Solo payment",
            transaction_type=TransactionType.EVEN,
            group_id=test_group.id,
            payer_id=test_user.id
        )
        session.add(transaction)
        session.commit()
        session.refresh(transaction)

        # Create transaction participant where the payer also owes (should be filtered out)
        participant = TransactionParticipant(
            transaction_id=transaction.id,
            debtor_id=test_user.id,  # Same as payer
            amount_owed=1000
        )
        session.add(participant)
        session.commit()

        response = client.get("/balances/", headers=auth_headers)

        assert response.status_code == 200
        balance_data = response.json()
        assert balance_data["user_id"] == str(test_user.id)
        # Should have no balance since payer = debtor relationships are filtered out
        assert balance_data["total_balance"] == 0
        assert balance_data["total_owed_by_others"] == 0
        assert balance_data["total_owed_to_others"] == 0
        assert balance_data["user_balances"] == []
