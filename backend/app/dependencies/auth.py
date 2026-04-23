"""Common FastAPI dependency types used across routers.

Replaces the 3-line `token + settings + AuthService.get_current_user` preamble
that was repeated in every protected endpoint.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends

from app import config
from app.database.database import SessionDep
from app.database.models.user import User
from app.services.auth import AuthService, oauth2_scheme


CurrentSettings = Annotated[config.Settings, Depends(config.get_settings)]


async def _current_user(
    session: SessionDep,
    settings: CurrentSettings,
    token: Annotated[str, Depends(oauth2_scheme)],
) -> User:
    return await AuthService.get_current_user(session, token, settings)


CurrentUser = Annotated[User, Depends(_current_user)]
