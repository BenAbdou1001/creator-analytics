"""Identifiable individuals, kept apart from aggregate audience analytics."""

from datetime import date, datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.creator import enums
from app.creator.model.types import platform_t, relation_t
from common.model import BATCH_FK, NOW, MappedBase


class Person(MappedBase):
    __tablename__ = 'people'
    __table_args__ = (sa.UniqueConstraint('platform', 'handle'),)

    person_id: Mapped[int] = mapped_column(primary_key=True)
    platform: Mapped[enums.Platform] = mapped_column(platform_t)
    external_id: Mapped[str | None]
    handle: Mapped[str | None]
    display_name: Mapped[str | None]
    headline: Mapped[str | None]  # LinkedIn headline
    profile_url: Mapped[str | None]
    email: Mapped[str | None]  # LinkedIn connection export, only if shared
    is_verified: Mapped[bool | None]
    first_seen_at: Mapped[datetime] = mapped_column(server_default=NOW)


class Relationship(MappedBase):
    """Follower / subscriber / connection lists. Dashboards give no history, so unfollows are
    inferred by snapshotting: first/last batch per relation."""

    __tablename__ = 'relationships'
    __table_args__ = (sa.UniqueConstraint('account_id', 'person_id', 'relation'),)

    relationship_id: Mapped[int] = mapped_column(primary_key=True)
    account_id: Mapped[int] = mapped_column(sa.ForeignKey('accounts.account_id', ondelete='CASCADE'))
    person_id: Mapped[int] = mapped_column(sa.ForeignKey('people.person_id'))
    relation: Mapped[enums.Relation] = mapped_column(relation_t)
    relation_since: Mapped[date | None]  # LinkedIn connection date; YT only within 28 days
    first_batch_id: Mapped[int | None] = mapped_column(sa.ForeignKey('import_batches.batch_id', **BATCH_FK))
    last_batch_id: Mapped[int | None] = mapped_column(sa.ForeignKey('import_batches.batch_id', **BATCH_FK))
    first_observed_at: Mapped[datetime] = mapped_column(server_default=NOW)
    last_observed_at: Mapped[datetime] = mapped_column(server_default=NOW)
    ended_inferred_at: Mapped[datetime | None]  # set when a later full snapshot no longer lists them
