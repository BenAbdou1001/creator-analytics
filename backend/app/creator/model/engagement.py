from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.creator import enums
from app.creator.model.types import comment_status_t, interaction_t, platform_t
from common.model import BATCH_FK, NOW, MappedBase


class Comment(MappedBase):
    __tablename__ = 'comments'
    __table_args__ = (sa.UniqueConstraint('platform', 'external_id'),)

    comment_id: Mapped[int] = mapped_column(primary_key=True)
    content_id: Mapped[int] = mapped_column(sa.ForeignKey('content_items.content_id', ondelete='CASCADE'))
    platform: Mapped[enums.Platform] = mapped_column(platform_t)
    external_id: Mapped[str]
    parent_comment_id: Mapped[int | None] = mapped_column(sa.ForeignKey('comments.comment_id'))  # threading
    author_person_id: Mapped[int | None] = mapped_column(sa.ForeignKey('people.person_id'))
    is_owner_comment: Mapped[bool] = mapped_column(server_default=sa.false())  # replies posted by your account
    body: Mapped[str | None]
    posted_at: Mapped[datetime | None]
    like_count: Mapped[int | None] = mapped_column(sa.Integer)
    reply_count: Mapped[int | None] = mapped_column(sa.Integer)
    is_pinned: Mapped[bool] = mapped_column(server_default=sa.false())
    is_hearted: Mapped[bool] = mapped_column(server_default=sa.false())  # YouTube heart by creator
    status: Mapped[enums.CommentStatus] = mapped_column(comment_status_t, server_default='published')
    status_reason: Mapped[str | None]  # 'spam', 'keyword:<x>', 'held 60d'
    held_expires_at: Mapped[datetime | None]  # YouTube held comments (60 days)
    first_captured_at: Mapped[datetime] = mapped_column(server_default=NOW)
    last_captured_at: Mapped[datetime] = mapped_column(server_default=NOW)
    deleted_observed_at: Mapped[datetime | None]  # comment vanished between captures
    batch_id: Mapped[int | None] = mapped_column(sa.ForeignKey('import_batches.batch_id', **BATCH_FK))


sa.Index('comments_content_id_posted_at_idx', Comment.content_id, Comment.posted_at)
sa.Index('comments_author_person_id_idx', Comment.author_person_id)
sa.Index('comments_parent_comment_id_idx', Comment.parent_comment_id)


class Interaction(MappedBase):
    """Reaction lists, repost lists, mentions, tags, profile viewers..."""

    __tablename__ = 'interactions'

    interaction_id: Mapped[int] = mapped_column(primary_key=True)
    account_id: Mapped[int] = mapped_column(sa.ForeignKey('accounts.account_id', ondelete='CASCADE'))
    content_id: Mapped[int | None] = mapped_column(sa.ForeignKey('content_items.content_id', ondelete='CASCADE'))
    person_id: Mapped[int | None] = mapped_column(sa.ForeignKey('people.person_id'))
    interaction_type: Mapped[enums.Interaction] = mapped_column(interaction_t)
    detail: Mapped[str | None]  # LinkedIn reaction kind, story reply text...
    occurred_at: Mapped[datetime | None]
    visible_window_days: Mapped[int | None] = mapped_column(sa.Integer)  # TikTok profile views 30, IG story 2...
    captured_at: Mapped[datetime] = mapped_column(server_default=NOW)
    batch_id: Mapped[int | None] = mapped_column(sa.ForeignKey('import_batches.batch_id', **BATCH_FK))


sa.Index('interactions_account_id_interaction_type_occurred_at_idx',
         Interaction.account_id, Interaction.interaction_type, Interaction.occurred_at.desc())
sa.Index('interactions_content_id_interaction_type_idx', Interaction.content_id, Interaction.interaction_type)
