from datetime import datetime
from typing import Any

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column

from app.creator import enums
from app.creator.model.types import (
    audience_awareness_t,
    content_format_t,
    content_type_t,
    cta_placement_t,
    platform_t,
    visibility_t,
)
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


_texts = postgresql.ARRAY(sa.Text)


class ContentBrief(MappedBase):
    """The creative decisions behind a post, written by hand (or by an agent), never by sync/import.

    Many per post: one per version/iteration. The current one is the highest brief_id; there is no
    version column, so concurrent inserts can never collide on a number.
    """

    __tablename__ = 'content_briefs'
    __table_args__ = (sa.CheckConstraint('audio_quality BETWEEN 1 AND 5', name='audio_quality'),)

    brief_id: Mapped[int] = mapped_column(primary_key=True)
    content_id: Mapped[int] = mapped_column(sa.ForeignKey('content_items.content_id', ondelete='CASCADE'),
                                            index=True)
    label: Mapped[str | None]  # "A - question hook"
    active_from: Mapped[datetime] = mapped_column(server_default=NOW)  # when this version went live
    # attributes
    topic: Mapped[str | None]
    content_pillar: Mapped[str | None]
    content_format: Mapped[enums.ContentFormat | None] = mapped_column(content_format_t)
    target_audience: Mapped[str | None]
    audience_awareness: Mapped[enums.AudienceAwareness | None] = mapped_column(audience_awareness_t)
    # hook
    hook_text: Mapped[str | None]
    hook_type: Mapped[str | None]
    hook_duration_seconds: Mapped[float | None]
    hook_visual: Mapped[str | None]
    hook_audio: Mapped[str | None]
    hook_technique: Mapped[str | None]
    hook_promise: Mapped[str | None]
    hook_pattern: Mapped[str | None]
    # script
    script: Mapped[str | None]
    narrative_structure: Mapped[str | None]
    context: Mapped[str | None]
    main_points: Mapped[list[str] | None] = mapped_column(_texts)
    transitions: Mapped[list[str] | None] = mapped_column(_texts)
    climax: Mapped[str | None]
    cta: Mapped[str | None]
    cta_placement: Mapped[enums.CtaPlacement | None] = mapped_column(cta_placement_t)
    voiceover: Mapped[bool | None]
    audio_quality: Mapped[int | None] = mapped_column(sa.SmallInteger)  # 1-5
    accent: Mapped[str | None]
    # editing & pacing
    editing_style: Mapped[str | None]
    editing_rhythm: Mapped[str | None]  # fast / medium / slow
    pattern_interruptions: Mapped[list[str] | None] = mapped_column(_texts)
    speed_changes: Mapped[bool | None]
    text_animation: Mapped[str | None]
    intro_duration_seconds: Mapped[float | None]
    outro_duration_seconds: Mapped[float | None]
    # written composition
    opening_line: Mapped[str | None]
    writing_style: Mapped[str | None]
    writing_structure: Mapped[str | None]
    main_message: Mapped[str | None]
    storytelling: Mapped[bool | None]
    formatting: Mapped[str | None]
    caption_cta: Mapped[str | None]
    notes: Mapped[str | None]
    updated_at: Mapped[datetime] = mapped_column(server_default=NOW, onupdate=NOW)
