from datetime import date, datetime
from typing import Any

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.creator import enums
from app.creator.model.types import account_type_t, platform_t
from common.model import NOW, MappedBase


class Account(MappedBase):
    """One creator account on one platform."""

    __tablename__ = 'accounts'
    __table_args__ = (sa.UniqueConstraint('platform', 'handle'),)

    account_id: Mapped[int] = mapped_column(primary_key=True)
    platform: Mapped[enums.Platform] = mapped_column(platform_t)
    account_type: Mapped[enums.AccountType] = mapped_column(account_type_t)
    external_id: Mapped[str | None]  # channel id, member urn, etc.
    handle: Mapped[str]
    display_name: Mapped[str | None]
    profile_url: Mapped[str | None]
    is_monetized: Mapped[bool] = mapped_column(server_default=sa.false())  # YPP, Creator Rewards, etc.
    is_public: Mapped[bool] = mapped_column(server_default=sa.true())  # private IG gets no insights
    premium_tier: Mapped[str | None]  # LinkedIn Premium, Meta One plan...
    region: Mapped[str | None]
    created_on: Mapped[date | None]
    notes: Mapped[str | None]


class AccountProfileSnapshot(MappedBase):
    __tablename__ = 'account_profile_snapshots'

    snapshot_id: Mapped[int] = mapped_column(primary_key=True)
    account_id: Mapped[int] = mapped_column(sa.ForeignKey('accounts.account_id', ondelete='CASCADE'))
    captured_at: Mapped[datetime] = mapped_column(server_default=NOW)
    bio: Mapped[str | None]
    headline: Mapped[str | None]
    links: Mapped[dict[str, Any] | None]  # website / contact links
    contact_email: Mapped[str | None]
    follower_count: Mapped[int | None]
    following_count: Mapped[int | None]
    connection_count: Mapped[int | None]
    content_count: Mapped[int | None]
    extra: Mapped[dict[str, Any] | None]  # platform-specific profile fields


sa.Index('account_profile_snapshots_account_id_captured_at_idx',
         AccountProfileSnapshot.account_id, AccountProfileSnapshot.captured_at.desc())
