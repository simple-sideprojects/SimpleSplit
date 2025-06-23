import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select
from uuid import uuid4
from datetime import datetime

from app.database.models.transaction import Transaction, TransactionType
from app.database.models.group import Group
from app.database.models.user import User


class TestTransactionEndpoints:
    """Integration tests for transaction endpoints"""

    def test_create_transaction_success(self, client: TestClient, auth_headers: dict, test_group: Group, test_user: User, test_user_2: User, session: Session):
        """Test successful transaction creation"""
        
        test_group.users.append(test_user_2)
        session.add(test_group)
        session.commit()
        session.refresh(test_group)

        transaction_data = {
            "amount": 5000,  # $50.00 in cents
            "title": "A test transaction",
            "transaction_type": "EVEN",
            "group_id": str(test_group.id),
            "payer_id": str(test_user.id),
            "participants": [
                {
                    "debtor_id": str(test_user_2.id),
                    "amount_owed": 2500
                }
            ]
        }
        
        response = client.post("/transactions", json=transaction_data, headers=auth_headers)
        
        assert response.status_code == 201
        response_data = response.json()
        assert response_data["amount"] == transaction_data["amount"]
        assert response_data["title"] == transaction_data["title"]
        assert response_data["transaction_type"] == transaction_data["transaction_type"]
        assert response_data["group_id"] == transaction_data["group_id"]
        assert response_data["payer_id"] == transaction_data["payer_id"]

    def test_create_transaction_invalid_group(self, client: TestClient, auth_headers: dict, test_user: User):
        """Test creating transaction with invalid group fails"""
        fake_group_id = uuid4()
        transaction_data = {
            "amount": 1000,
            "title": "Invalid transaction",
            "transaction_type": "EVEN",
            "group_id": str(fake_group_id),
            "payer_id": str(test_user.id),
            "participants": []
        }
        
        response = client.post("/transactions/", json=transaction_data, headers=auth_headers)
        
        assert response.status_code in [403, 404]

    def test_get_transaction_success(self, client: TestClient, auth_headers: dict, test_group: Group, test_user: User, session: Session):
        """Test getting a specific transaction"""
        # Create a transaction first
        transaction = Transaction(
            amount=2000,
            title="Transaction for get test",
            transaction_type=TransactionType.EVEN,
            group_id=test_group.id,
            payer_id=test_user.id
        )
        session.add(transaction)
        session.commit()
        session.refresh(transaction)
        
        response = client.get(f"/transactions/{transaction.id}", headers=auth_headers)
        
        assert response.status_code == 200
        response_data = response.json()
        assert response_data["id"] == str(transaction.id)
        assert response_data["amount"] == transaction.amount
        assert response_data["title"] == transaction.title

    def test_get_transaction_not_found(self, client: TestClient, auth_headers: dict):
        """Test getting non-existent transaction returns 404"""
        fake_transaction_id = uuid4()
        
        response = client.get(f"/transactions/{fake_transaction_id}", headers=auth_headers)
        
        assert response.status_code == 404
        assert "Transaction not found" in response.json()["detail"]

    def test_update_transaction_success(self, client: TestClient, auth_headers: dict, test_group: Group, test_user: User, session: Session):
        """Test successful transaction update"""
        # Create a transaction first
        transaction = Transaction(
            amount=1500,
            title="Original title",
            transaction_type=TransactionType.EVEN,
            group_id=test_group.id,
            payer_id=test_user.id
        )
        session.add(transaction)
        session.commit()
        session.refresh(transaction)
        
        update_data = {
            "amount": 2500,
            "title": "Updated title"
        }
        
        response = client.put(f"/transactions/{transaction.id}", json=update_data, headers=auth_headers)
        
        assert response.status_code == 200
        response_data = response.json()
        assert response_data["amount"] == update_data["amount"]
        assert response_data["title"] == update_data["title"]
        
        # Verify transaction was updated in database
        session.refresh(transaction)
        assert transaction.amount == update_data["amount"]
        assert transaction.title == update_data["title"]

    def test_update_transaction_partial(self, client: TestClient, auth_headers: dict, test_group: Group, test_user: User, session: Session):
        """Test partial transaction update (only title)"""
        # Create a transaction first
        transaction = Transaction(
            amount=1800,
            title="Original title",
            transaction_type=TransactionType.EVEN,
            group_id=test_group.id,
            payer_id=test_user.id
        )
        session.add(transaction)
        session.commit()
        session.refresh(transaction)
        
        original_amount = transaction.amount
        update_data = {
            "title": "Only Title Updated"
        }
        
        response = client.put(f"/transactions/{transaction.id}", json=update_data, headers=auth_headers)
        
        assert response.status_code == 200
        response_data = response.json()
        assert response_data["title"] == update_data["title"]
        assert response_data["amount"] == original_amount
        
        # Verify in database
        session.refresh(transaction)
        assert transaction.title == update_data["title"]
        assert transaction.amount == original_amount

    def test_delete_transaction_success(self, client: TestClient, auth_headers: dict, test_group: Group, test_user: User, session: Session):
        """Test successful transaction deletion"""
        # Create a transaction first
        transaction = Transaction(
            amount=1200,
            title="This will be deleted",
            transaction_type=TransactionType.EVEN,
            group_id=test_group.id,
            payer_id=test_user.id
        )
        session.add(transaction)
        session.commit()
        session.refresh(transaction)
        
        response = client.delete(f"/transactions/{transaction.id}", headers=auth_headers)
        
        assert response.status_code == 204

    def test_delete_transaction_not_found(self, client: TestClient, auth_headers: dict):
        """Test deleting non-existent transaction returns 404"""
        fake_transaction_id = uuid4()
        
        response = client.delete(f"/transactions/{fake_transaction_id}", headers=auth_headers)
        
        assert response.status_code == 404
        assert "Transaction not found" in response.json()["detail"]

    def test_get_transactions_list(self, client: TestClient, auth_headers: dict, test_group: Group, test_user: User, session: Session):
        """Test getting list of transactions user is involved in"""
        # Create a transaction first
        transaction = Transaction(
            amount=3000,
            title="List test transaction",
            transaction_type=TransactionType.EVEN,
            group_id=test_group.id,
            payer_id=test_user.id
        )
        session.add(transaction)
        session.commit()
        
        response = client.get("/transactions/", headers=auth_headers)
        
        assert response.status_code == 200
        transactions = response.json()
        assert isinstance(transactions, list)

    def test_get_transactions_with_pagination(self, client: TestClient, auth_headers: dict, test_group: Group, test_user: User, session: Session):
        """Test getting transactions with pagination"""
        # Create multiple transactions
        for i in range(5):
            transaction = Transaction(
                amount=1000 + i * 100,
                title=f"Transaction {i}",
                transaction_type=TransactionType.EVEN,
                group_id=test_group.id,
                payer_id=test_user.id
            )
            session.add(transaction)
        session.commit()
        
        response = client.get("/transactions/?skip=0&limit=3", headers=auth_headers)
        
        assert response.status_code == 200
        transactions = response.json()
        assert isinstance(transactions, list)
        assert len(transactions) <= 3

    def test_get_transactions_by_group(self, client: TestClient, auth_headers: dict, test_group: Group, test_user: User, session: Session):
        """Test getting transactions filtered by group"""
        # Create a transaction for the test group
        transaction = Transaction(
            amount=2500,
            title="Group specific transaction",
            transaction_type=TransactionType.EVEN,
            group_id=test_group.id,
            payer_id=test_user.id
        )
        session.add(transaction)
        session.commit()
        
        response = client.get(f"/transactions/?group_id={test_group.id}", headers=auth_headers)
        
        assert response.status_code == 200
        transactions = response.json()
        assert isinstance(transactions, list) 