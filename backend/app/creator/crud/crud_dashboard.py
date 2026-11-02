from datetime import date

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import distinct_on
from sqlalchemy.ext.asyncio import AsyncSession

from app.creator.model import (
    Account,
    AccountMetricFact,
    AccountProfileSnapshot,
    ContentItem,
    ImportBatch,
    MetricDefinition,
    v_content_summary,
)


class CRUDDashboard:
    @staticmethod
    async def overview(db: AsyncSession) -> list[dict]:
        a = Account
        # latest follower count from either a profile snapshot or a follower metric
        followers = sa.union_all(
            sa.select(sa.cast(AccountProfileSnapshot.follower_count, sa.Numeric(asdecimal=False)).label('v'),
                      AccountProfileSnapshot.captured_at)
            .where(AccountProfileSnapshot.account_id == a.account_id, AccountProfileSnapshot.follower_count.is_not(None)),
            sa.select(AccountMetricFact.value, AccountMetricFact.captured_at)
            .join(MetricDefinition, MetricDefinition.metric_id == AccountMetricFact.metric_id)
            .where(AccountMetricFact.account_id == a.account_id,
                   MetricDefinition.metric_key.in_(['total_followers', 'subscribers_realtime'])),
        ).subquery()
        s = v_content_summary.c

        def total(col):
            return sa.select(sa.func.sum(col)).where(s.account_id == a.account_id).scalar_subquery()

        stmt = sa.select(
            a.account_id, a.platform, a.handle, a.display_name, a.account_type,
            sa.select(followers.c.v).order_by(followers.c.captured_at.desc()).limit(1).scalar_subquery()
            .label('followers'),
            sa.select(sa.func.count()).where(ContentItem.account_id == a.account_id,
                                             ContentItem.deleted_observed_at.is_(None)).scalar_subquery()
            .label('content_count'),
            total(s.views).label('total_views'),
            total(s.impressions).label('total_impressions'),
            total(s.engagements).label('total_engagements'),
            sa.select(sa.func.max(ImportBatch.imported_at)).where(ImportBatch.account_id == a.account_id)
            .scalar_subquery().label('last_import'),
        ).order_by(a.platform, a.handle)
        return [dict(r) for r in (await db.execute(stmt)).mappings()]

    @staticmethod
    async def timeseries(db: AsyncSession, account_id: int, metric_key: str, start: date | None, end: date | None,
                         period_kind: str) -> list[dict]:
        """Latest captured value per period for one account-level metric."""
        f = AccountMetricFact
        stmt = (sa.select(f.period_start, f.period_end, f.value, f.captured_at, f.batch_id)
                .ext(distinct_on(f.period_start, f.period_end))
                .join(MetricDefinition, MetricDefinition.metric_id == f.metric_id)
                .where(f.account_id == account_id, MetricDefinition.metric_key == metric_key,
                       f.period_kind == period_kind,
                       *([f.period_start >= start] if start else []), *([f.period_end <= end] if end else []))
                .order_by(f.period_start, f.period_end, f.captured_at.desc()))
        return [dict(r) for r in (await db.execute(stmt)).mappings()]

    @staticmethod
    async def saved_history(db: AsyncSession) -> list[dict]:
        """For every account and every metric its platform eventually deletes: what we hold."""
        a, m, f = Account, MetricDefinition, AccountMetricFact
        daily = f.period_kind == 'day'
        stmt = (sa.select(a.account_id, a.platform, a.handle, m.metric_key, m.label, m.gui_path, m.retention_days,
                          sa.func.min(f.period_start).filter(daily).label('first_day'),
                          sa.func.max(f.period_end).filter(daily).label('last_day'),
                          sa.func.count(f.period_start.distinct()).filter(daily).label('days_saved'),
                          sa.func.count(f.fact_id).label('facts'))
                .join(m, m.platform == a.platform)
                .outerjoin(f, sa.and_(f.account_id == a.account_id, f.metric_id == m.metric_id))
                .where(m.scope == 'account', m.retention_days.is_not(None))
                .group_by(a.account_id, m.metric_id))
        return [dict(r) for r in (await db.execute(stmt)).mappings()]


dashboard_dao = CRUDDashboard()
