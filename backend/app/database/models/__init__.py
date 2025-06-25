from .base import BaseModel
from .user import User, UserCreate, UserResponse
from .group import Group, CreateGroup, GroupResponse, GroupExpandedResponse, UpdateGroup
from .invite import GroupInvite, GroupInviteCreate, GroupInviteResponse, InvitationTokenResponse
from .users_groups import UsersGroups
from .transaction import (
    Transaction,
    TransactionType,
    TransactionCreate,
    TransactionRead,
    TransactionUpdate,
)
from .transaction_participant import (
    TransactionParticipant,
    TransactionParticipantCreate,
    TransactionParticipantRead,
    TransactionParticipantUpdate,
)
from .balance import Balance, UserBalance
from .auth import (
    EmailPasswordLoginRequest,
    Token,
    JWTPayload,
    UserJWTData,
    EmailConfirmationRequest,
)

User.model_rebuild()
Group.model_rebuild()
GroupInvite.model_rebuild()
GroupResponse.model_rebuild()
GroupExpandedResponse.model_rebuild()
Transaction.model_rebuild()
TransactionParticipant.model_rebuild()
TransactionCreate.model_rebuild()
TransactionRead.model_rebuild()
Balance.model_rebuild()

__all__ = [
    "BaseModel",
    # User models
    "User",
    "UserCreate",
    "UserResponse",
    # Group models
    "Group",
    "CreateGroup",
    "GroupResponse",
    "GroupExpandedResponse",
    "UpdateGroup",
    # Invite models
    "GroupInvite",
    "GroupInviteCreate",
    "GroupInviteResponse",
    "InvitationTokenResponse",
    # Relationship models
    "UsersGroups",
    # Transaction models
    "Transaction",
    "TransactionType",
    "TransactionCreate",
    "TransactionRead",
    "TransactionUpdate",
    # Transaction participant models
    "TransactionParticipant",
    "TransactionParticipantCreate",
    "TransactionParticipantRead",
    "TransactionParticipantUpdate",
    # Balance models
    "Balance",
    "UserBalance",
    # Auth models
    "EmailPasswordLoginRequest",
    "Token",
    "JWTPayload",
    "UserJWTData",
    "EmailConfirmationRequest",
]
