from typing import Optional
from uuid import UUID
from sqlmodel import select, func, case

from app.database.database import SessionDep
from app.database.models.balance import Balance, UserBalance
from app.database.models.transaction import Transaction
from app.database.models.transaction_participant import TransactionParticipant
from app.database.models.user import User, UserResponse


class BalanceService:
    @staticmethod
    def calculate_balance(
        session: SessionDep,
        current_user_id: UUID,
        group_id: Optional[UUID] = None
    ) -> Balance:
        """Calculate balance for user, optionally filtered by group"""

        total_balances = BalanceService.get_total_balances_for_user(
            session, current_user_id, group_id)
        user_balances = BalanceService.get_user_balances_for_user(
            session, current_user_id, group_id)

        return Balance.model_construct(
            user_id=current_user_id,
            group_id=group_id,
            total_balance=total_balances['total_balance'],
            total_owed_by_others=total_balances['total_owed_by_others'],
            total_owed_to_others=total_balances['total_owed_to_others'],
            user_balances=user_balances
        )

    @staticmethod
    def get_total_balances_for_user(
        session: SessionDep,
        current_user_id: UUID,
        group_id: Optional[UUID] = None
    ) -> dict[str, int]:
        """Get total balance for user, optionally filtered by group"""
        balance_query = select(
            func.sum(
                case(
                    (Transaction.payer_id == current_user_id,
                     TransactionParticipant.amount_owed),
                    else_=0
                )
            ).label('total_owed_by_others'),
            func.sum(
                case(
                    (TransactionParticipant.debtor_id == current_user_id,
                     TransactionParticipant.amount_owed),
                    else_=0
                )
            ).label('total_owed_to_others'),
        ).select_from(
            Transaction
        ).join(
            TransactionParticipant,
            Transaction.id == TransactionParticipant.transaction_id
        ).where(
            (Transaction.payer_id == current_user_id) |
            (TransactionParticipant.debtor_id == current_user_id),
            TransactionParticipant.debtor_id != Transaction.payer_id
        )

        if group_id:
            balance_query = balance_query.where(
                Transaction.group_id == group_id)

        result = session.exec(balance_query).first()

        total_owed_by_others = result.total_owed_by_others or 0 if result else 0
        total_owed_to_others = result.total_owed_to_others or 0 if result else 0

        return {
            'total_balance': total_owed_by_others - total_owed_to_others,
            'total_owed_by_others': total_owed_by_others,
            'total_owed_to_others': total_owed_to_others
        }

    @staticmethod
    def get_user_balances_for_user(
        session: SessionDep,
        current_user_id: UUID,
        group_id: Optional[UUID] = None
    ) -> list[UserBalance]:
        """Get balances for user, optionally filtered by group"""

        balance_query = select(
            User,
            func.sum(
                case(
                    (Transaction.payer_id == current_user_id,
                     TransactionParticipant.amount_owed),
                    else_=-TransactionParticipant.amount_owed
                )
            ).label('balance')
        ).select_from(
            Transaction
        ).join(
            TransactionParticipant,
            Transaction.id == TransactionParticipant.transaction_id
        ).join(
            User,
            onclause=User.id == case(
                (Transaction.payer_id == current_user_id,
                 TransactionParticipant.debtor_id),
                else_=Transaction.payer_id
            )
        ).where(
            (Transaction.payer_id == current_user_id) |
            (TransactionParticipant.debtor_id == current_user_id),
            TransactionParticipant.debtor_id != Transaction.payer_id
        )

        if group_id:
            balance_query = balance_query.where(
                Transaction.group_id == group_id)

        balance_query = balance_query.group_by(User.id)

        results = session.exec(balance_query).all()

        return [UserBalance.model_validate({
            'user': UserResponse.model_validate(result.User),
            'balance': result.balance,
        }) for result in results if result.balance != 0]
