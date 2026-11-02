"""Metric catalogue lookups and the long/narrow fact tables."""

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.creator.utils.parse import parse_date as _date
from app.creator.model import AccountMetricFact, BreakdownFact, ContentMetricFact, MetricDefinition, RevenueFact


class CRUDMetric:
    @staticmethod
    async def lookup(db: AsyncSession, platform: str, scope: str) -> dict[str, int]:
        """metric_key and GUI label (lower-cased) -> metric_id."""
        out = {}
        rows = await db.execute(sa.select(MetricDefinition.metric_id, MetricDefinition.metric_key, MetricDefinition.label)
                                .where(MetricDefinition.platform == platform, MetricDefinition.scope == scope))
        for metric_id, key, label in rows:
            out[label.lower()] = metric_id
            out[key] = metric_id
        return out

    @staticmethod
    def resolve(metric_ids: dict[str, int], name) -> int | None:
        return metric_ids.get(str(name).lower()) or metric_ids.get(name)

    @staticmethod
    async def add_content_fact(db: AsyncSession, content_id: int, metric_id: int, period: dict, value,
                               batch_id: int) -> int:
        stmt = insert(ContentMetricFact).values(
            content_id=content_id, metric_id=metric_id, period_kind=period['period_kind'],
            period_start=_date(period.get('period_start')), period_end=_date(period.get('period_end')),
            value=value, batch_id=batch_id).on_conflict_do_nothing().returning(ContentMetricFact.fact_id)
        return len((await db.execute(stmt)).all())  # 0 when the same snapshot was already stored

    @staticmethod
    async def add_account_fact(db: AsyncSession, account_id: int, metric_id: int, row: dict, batch_id: int) -> int:
        start = _date(row['period_start'])
        stmt = insert(AccountMetricFact).values(
            account_id=account_id, metric_id=metric_id, period_kind=row.get('period_kind', 'day'),
            period_start=start, period_end=_date(row.get('period_end')) or start,
            value=row['value'], batch_id=batch_id).on_conflict_do_nothing().returning(AccountMetricFact.fact_id)
        return len((await db.execute(stmt)).all())

    @staticmethod
    async def add_breakdown_fact(db: AsyncSession, **values) -> None:
        values['period_start'] = _date(values.get('period_start'))
        values['period_end'] = _date(values.get('period_end'))
        db.add(BreakdownFact(**values))

    @staticmethod
    async def add_revenue_fact(db: AsyncSession, account_id: int, metric_id: int, row: dict, batch_id: int) -> None:
        start = _date(row['period_start'])
        db.add(RevenueFact(account_id=account_id, metric_id=metric_id, revenue_source=row['revenue_source'],
                           currency=row.get('currency'), period_kind=row.get('period_kind', 'month'),
                           period_start=start, period_end=_date(row.get('period_end')) or start, value=row['value'],
                           is_estimated=row.get('is_estimated', True), batch_id=batch_id))


metric_dao = CRUDMetric()
