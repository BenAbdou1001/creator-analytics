from datetime import datetime
from typing import Any

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.creator import enums
from app.creator.model.types import content_type_t, platform_t, visibility_t
from common.model import NOW, MappedBase


class ContentItem(MappedBase):
    __tablename__ = 'content_items'
    __table_args__ = (sa.UniqueConstraint('platform', 'external_id'),)

    content_id: Mapped[int] = mapped_column(primary_key=True)
    account_id: Mapped[int] = mapped_column(sa.ForeignKey('accounts.account_id', ondelete='CASCADE'))
    platform: Mapped[enums.Platform] = mapped_column(platform_t)
    external_id: Mapped[str]  # video id / post urn / media id
    content_type: Mapped[enums.ContentType] = mapped_column(content_type_t)
    # live -> recording, carousel item, repost -> original
    parent_content_id: Mapped[int | None] = mapped_column(sa.ForeignKey('content_items.content_id'))
    original_author: Mapped[str | None]  # for reposts
    title: Mapped[str | None]
    caption: Mapped[str | None]  # description / caption / post text
    url: Mapped[str | None]
    visibility: Mapped[enums.Visibility] = mapped_column(visibility_t, server_default='unknown')
    status: Mapped[str | None]  # processing, restricted, etc.
    restrictions: Mapped[str | None]  # YouTube restrictions column
    published_at: Mapped[datetime | None]
    scheduled_for: Mapped[datetime | None]
    duration_seconds: Mapped[float | None]
    thumbnail_url: Mapped[str | None]
    language: Mapped[str | None]
    is_collab: Mapped[bool] = mapped_column(server_default=sa.false())
    first_seen_at: Mapped[datetime] = mapped_column(server_default=NOW)
    last_seen_at: Mapped[datetime] = mapped_column(server_default=NOW)
    deleted_observed_at: Mapped[datetime | None]
    extra: Mapped[dict[str, Any] | None]


sa.Index('content_items_account_id_published_at_idx', ContentItem.account_id, ContentItem.published_at.desc())
sa.Index('content_items_account_id_content_type_idx', ContentItem.account_id, ContentItem.content_type)


class ContentTag(MappedBase):
    __tablename__ = 'content_tags'
    __table_args__ = (
        sa.CheckConstraint("tag_type IN ('hashtag','mention','collaborator','location','product')", name='tag_type'),
    )

    content_id: Mapped[int] = mapped_column(sa.ForeignKey('content_items.content_id', ondelete='CASCADE'),
                                            primary_key=True)
    tag_type: Mapped[str] = mapped_column(primary_key=True)
    value: Mapped[str] = mapped_column(primary_key=True)
    person_id: Mapped[int | None] = mapped_column(sa.ForeignKey('people.person_id', name='content_tags_person_fk'))


class LiveSession(MappedBase):
    __tablename__ = 'live_sessions'

    content_id: Mapped[int] = mapped_column(sa.ForeignKey('content_items.content_id', ondelete='CASCADE'),
                                            primary_key=True, autoincrement=False)
    started_at: Mapped[datetime | None]
    ended_at: Mapped[datetime | None]
    peak_concurrent: Mapped[int | None] = mapped_column(sa.Integer)
    avg_concurrent: Mapped[float | None]
    has_recording: Mapped[bool | None]
