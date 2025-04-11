import secrets
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from app import config
from app.database.database import SessionDep
from app.database.models.group import Group
from app.database.models.invite import GroupInvite, GroupInviteCreate, GroupInviteResponse, InvitationTokenResponse
from app.database.models.user import User
from app.database.models.users_groups import UsersGroups
from app.services.auth import AuthService, oauth2_scheme
from app.middleware.is_user_group import is_user_in_group

router = APIRouter(
    prefix="/invites",
    tags=["invites"],
    dependencies=[Depends(oauth2_scheme)]
)


@router.get("/my-invites", response_model=list[GroupInviteResponse])
async def get_my_invites(
    session: SessionDep,
    token: Annotated[str, Depends(oauth2_scheme)],
    settings: Annotated[config.Settings, Depends(config.get_settings)]
) -> list[GroupInviteResponse]:
    user = await AuthService.get_current_user(session, token, settings)

    invites = session.exec(
        select(GroupInvite).where(GroupInvite.email == user.email)
    ).all()

    return [
        GroupInviteResponse(
            id=invite.id,
            email=invite.email,
            group_id=invite.group_id,
            token=invite.token,
            created_at=invite.created_at
        ) for invite in invites
    ]


@router.post("/{group_id}/generate", response_model=InvitationTokenResponse)
async def generate_invite_link(
    session: SessionDep,
    db_group: Annotated[Group, Depends(is_user_in_group)]
) -> InvitationTokenResponse:
    token = secrets.token_urlsafe(16)

    invite = GroupInvite(
        group_id=db_group.id,
        token=token
    )

    session.add(invite)
    session.commit()
    session.refresh(invite)

    return InvitationTokenResponse(token=token)


@router.post("/{group_id}/email", response_model=GroupInviteResponse)
async def invite_by_email(
    invite_data: GroupInviteCreate,
    session: SessionDep,
    db_group: Annotated[Group, Depends(is_user_in_group)]
) -> GroupInviteResponse:
    if not invite_data.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required for email invitations"
        )

    user_exists = session.exec(
        select(User).where(User.email == invite_data.email)
    ).first()

    if not user_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    is_member = session.exec(
        select(UsersGroups).where(
            UsersGroups.user_id == user_exists.id,
            UsersGroups.group_id == db_group.id
        )
    ).first()

    if is_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this group"
        )

    existing_invite = session.exec(
        select(GroupInvite).where(
            GroupInvite.email == invite_data.email,
            GroupInvite.group_id == db_group.id
        )
    ).first()

    if existing_invite:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An invitation has already been sent to this email"
        )

    token = secrets.token_urlsafe(16)

    invite = GroupInvite(
        email=invite_data.email,
        group_id=db_group.id,
        token=token
    )

    session.add(invite)
    session.commit()
    session.refresh(invite)

    # TODO: Send email to user with invite link

    return GroupInviteResponse(
        id=invite.id,
        email=invite.email,
        group_id=invite.group_id,
        token=invite.token,
        created_at=invite.created_at
    )


@router.get("/accept/{token}", response_model=dict)
async def accept_invite(
    token: str,
    session: SessionDep,
    token_user: Annotated[str, Depends(oauth2_scheme)],
    settings: Annotated[config.Settings, Depends(config.get_settings)]
) -> dict:
    user = await AuthService.get_current_user(session, token_user, settings)

    invite = session.exec(
        select(GroupInvite).where(GroupInvite.token == token)
    ).first()

    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid invitation"
        )

    # If the invite has an email, verify it matches the current user
    if invite.email and invite.email != user.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This invitation is for a different user"
        )

    is_member = session.exec(
        select(UsersGroups).where(
            UsersGroups.user_id == user.id,
            UsersGroups.group_id == invite.group_id
        )
    ).first()

    if is_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already a member of this group"
        )

    group = session.exec(
        select(Group).where(Group.id == invite.group_id)
    ).first()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )

    users_groups = UsersGroups(
        user_id=user.id,
        group_id=group.id
    )

    if invite.email:
        session.delete(invite)

    session.add(users_groups)
    session.commit()

    return {"message": "Invitation accepted successfully"}


@router.delete("/reject/{token}", response_model=dict)
async def reject_invite(
    token: str,
    session: SessionDep,
    token_user: Annotated[str, Depends(oauth2_scheme)],
    settings: Annotated[config.Settings, Depends(config.get_settings)]
) -> dict:
    user = await AuthService.get_current_user(session, token_user, settings)

    invite = session.exec(
        select(GroupInvite).where(GroupInvite.token == token)
    ).first()

    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid invitation"
        )

    email_matches_user = invite.email and invite.email == user.email
    invite_belongs_to_user_in_group = invite.group_id in [
        group.id for group in user.groups
    ]

    if not email_matches_user and not invite_belongs_to_user_in_group:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid invitation"
        )

    session.delete(invite)
    session.commit()

    return {"message": "Invitation rejected successfully"}
