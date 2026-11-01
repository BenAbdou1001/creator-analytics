"""Metric facts, stored long/narrow so a new dashboard metric is an INSERT, not an ALTER TABLE."""

from datetime import date, datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.creator import enums
from app.creator.model.types import dimension_t, period_kind_t
from common.model import BATCH_FK, NOW, MappedBase


class AccountMetricFact(MappedBase):
    __tablename__ = 'account_metric_facts'
    __table_args__ = (
        # Postgres truncated the generated name to 63 chars; keep it so the live DB matches
        sa.UniqueConstraint('account_id', 'metric_id', 'period_kind', 'period_start', 'period_end', 'captured_at',
                            name='account_metric_facts_account_id_metric_id_period_kind_perio_key'),
    )

    fact_id: Mapped[int] = mapped_column(primary_key=True)
    account_id: Mapped[int] = mapped_column(sa.ForeignKey('accounts.account_id', ondelete='CASCADE'))
    metric_id: Mapped[int] = mapped_column(sa.Integer, sa.ForeignKey('metric_definitions.metric_id'))
    period_kind: Mapped[enums.PeriodKind] = mapped_column(period_kind_t)
    period_start: Mapped[date]
    period_end: Mapped[date]
    value: Mapped[float]
    captured_at: Mapped[datetime] = mapped_column(server_default=NOW)
    batch_id: Mapped[int | None] = mapped_column(sa.ForeignKey('import_batches.batch_id', **BATCH_FK))


sa.Index('account_metric_facts_account_id_metric_id_period_start_idx',
         AccountMetricFact.account_id, AccountMetricFact.metric_id, AccountMetricFact.period_start)


class ContentMetricFact(MappedBase):
    __tablename__ = 'content_metric_facts'

    fact_id: Mapped[int] = mapped_column(primary_key=True)
    content_id: Mapped[int] = mapped_column(sa.ForeignKey('content_items.content_id', ondelete='CASCADE'))
    metric_id: Mapped[int] = mapped_column(sa.Integer, sa.ForeignKey('metric_definitions.metric_id'))
    period_kind: Mapped[enums.PeriodKind] = mapped_column(period_kind_t)
    period_start: Mapped[date | None]  # NULL for lifetime/snapshot
    period_end: Mapped[date | None]
    value: Mapped[float]
    captured_at: Mapped[datetime] = mapped_column(server_default=NOW)
    batch_id: Mapped[int | None] = mapped_column(sa.ForeignKey('import_batches.batch_id', **BATCH_FK))


_NO_DATE = sa.text("'0001-01-01'::date")
sa.Index('content_metric_facts_uq', ContentMetricFact.content_id, ContentMetricFact.metric_id,
         ContentMetricFact.period_kind, sa.func.coalesce(ContentMetricFact.period_start, _NO_DATE),
         sa.func.coalesce(ContentMetricFact.period_end, _NO_DATE), ContentMetricFact.captured_at, unique=True)
sa.Index('content_metric_facts_content_id_metric_id_captured_at_idx',
         ContentMetricFact.content_id, ContentMetricFact.metric_id, ContentMetricFact.captured_at.desc())


class BreakdownFact(MappedBase):
    """Audience, demographics, traffic sources, search terms... content_id NULL => account-level breakdown."""

    __tablename__ = 'breakdown_facts'

    fact_id: Mapped[int] = mapped_column(primary_key=True)
    account_id: Mapped[int] = mapped_column(sa.ForeignKey('accounts.account_id', ondelete='CASCADE'))
    content_id: Mapped[int | None] = mapped_column(sa.ForeignKey('content_items.content_id', ondelete='CASCADE'))
    dimension: Mapped[enums.Dimension] = mapped_column(dimension_t)
    dimension_value: Mapped[str]  # '25-34', 'DZ', 'YouTube search', 'data engineer'
    metric_id: Mapped[int] = mapped_column(sa.Integer, sa.ForeignKey('metric_definitions.metric_id'))
    period_kind: Mapped[enums.PeriodKind] = mapped_column(period_kind_t, server_default='range')
    period_start: Mapped[date | None]
    period_end: Mapped[date | None]
    value: Mapped[float]  # count, or percent (see metric unit)
    captured_at: Mapped[datetime] = mapped_column(server_default=NOW)
    batch_id: Mapped[int | None] = mapped_column(sa.ForeignKey('import_batches.batch_id', **BATCH_FK))


sa.Index('breakdown_facts_account_id_dimension_captured_at_idx',
         BreakdownFact.account_id, BreakdownFact.dimension, BreakdownFact.captured_at.desc())
sa.Index('breakdown_facts_content_id_dimension_idx', BreakdownFact.content_id, BreakdownFact.dimension,
         postgresql_where=BreakdownFact.content_id.is_not(None))


class RetentionCurvePoint(MappedBase):
    """Per-video retention curves (YouTube, TikTok) and story navigation curves."""

    __tablename__ = 'retention_curve_points'
    __table_args__ = (sa.CheckConstraint('position_pct BETWEEN 0 AND 100', name='position_pct'),)

    content_id: Mapped[int] = mapped_column(sa.ForeignKey('content_items.content_id', ondelete='CASCADE'),
                                            primary_key=True)
    captured_at: Mapped[datetime] = mapped_column(primary_key=True)
    position_pct: Mapped[float] = mapped_column(primary_key=True)
    position_sec: Mapped[float | None]
    audience_pct: Mapped[float]  # share still watching
    batch_id: Mapped[int | None] = mapped_column(sa.ForeignKey('import_batches.batch_id', **BATCH_FK))


class RevenueFact(MappedBase):
    """Revenue / monetization (YPP, TikTok rewards, IG earnings)."""

    __tablename__ = 'revenue_facts'

    fact_id: Mapped[int] = mapped_column(primary_key=True)
    account_id: Mapped[int] = mapped_column(sa.ForeignKey('accounts.account_id', ondelete='CASCADE'))
    content_id: Mapped[int | None] = mapped_column(sa.ForeignKey('content_items.content_id', ondelete='CASCADE'))
    revenue_source: Mapped[str]  # ads, memberships, gifts/Diamonds, rewards...
    metric_id: Mapped[int] = mapped_column(sa.Integer, sa.ForeignKey('metric_definitions.metric_id'))
    currency: Mapped[str | None] = mapped_column(sa.CHAR(3))
    period_kind: Mapped[enums.PeriodKind] = mapped_column(period_kind_t)
    period_start: Mapped[date]
    period_end: Mapped[date]
    value: Mapped[float]
    is_estimated: Mapped[bool] = mapped_column(server_default=sa.true())
    captured_at: Mapped[datetime] = mapped_column(server_default=NOW)
    batch_id: Mapped[int | None] = mapped_column(sa.ForeignKey('import_batches.batch_id', **BATCH_FK))
