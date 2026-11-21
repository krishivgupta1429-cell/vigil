"""Tables owned by the journey module (M1)."""

import secrets

from sqlmodel import Field, SQLModel


def new_share_token() -> str:
    # 16 random bytes -> 22 URL-safe chars (128 bits): unguessable.
    return secrets.token_urlsafe(16)


class JourneyShare(SQLModel, table=True):
    """Public share link data for one Journey (one row per journey).

    Kept in its own table so models.py (shared) is untouched. The token is the
    only thing the public /api/track endpoint is keyed on.
    """

    journey_id: int = Field(foreign_key="journey.id", primary_key=True)
    share_token: str = Field(default_factory=new_share_token, index=True, unique=True)
    destination_name: str | None = None
