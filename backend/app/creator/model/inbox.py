"""Inbox (IG/LinkedIn DMs, TikTok inbox) – optional."""

from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.creator import enums
from app.creator.model.types import platform_t
from common.model import MappedBase


class Conversation(MappedBase):
    __tablename__ = 'conversations'
    __table_args__ = (sa.UniqueConstraint('platform', 'external_id'),)

    conversation_id: Mapped[int] = mapped_column(primary_key=True)
    account_id: Mapped[int] = mapped_column(sa.ForeignKey('accounts.account_id', ondelete='CASCADE'))
    platform: Mapped[enums.Platform] = mapped_column(platform_t)
    external_id: Mapped[str | None]
    last_message_at: Mapped[datetime | None]


class ConversationParticipant(MappedBase):
    __tablename__ = 'conversation_participants'

    conversation_id: Mapped[int] = mapped_column(
        sa.ForeignKey('conversations.conversation_id', ondelete='CASCADE'), primary_key=True)
    person_id: Mapped[int] = mapped_column(sa.ForeignKey('people.person_id'), primary_key=True)


class Message(MappedBase):
    __tablename__ = 'messages'

    message_id: Mapped[int] = mapped_column(primary_key=True)
    conversation_id: Mapped[int] = mapped_column(sa.ForeignKey('conversations.conversation_id', ondelete='CASCADE'))
    sender_person_id: Mapped[int | None] = mapped_column(sa.ForeignKey('people.person_id'))
    is_from_owner: Mapped[bool] = mapped_column(server_default=sa.false())
    body: Mapped[str | None]
    sent_at: Mapped[datetime | None]
