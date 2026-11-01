"""Snapshot-style syncs: each call runs in the caller's transaction and is recorded as one import batch."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.creator.crud.crud_account import account_dao
from app.creator.crud.crud_batch import batch_dao
from app.creator.crud.crud_content import MANAGED, content_dao
from app.creator.crud.crud_metric import metric_dao
from app.creator.crud.crud_relationship import relationship_dao
from app.creator.enums import Relation
from app.creator.utils.parse import parse_date
from common.exception import errors


class SyncService:
    @staticmethod
    async def sync_content(*, db: AsyncSession, account_id: int, items: list[dict], full_snapshot: bool = False,
                           period_kind: str = 'lifetime', default_content_type: str | None = None,
                           source_kind: str = 'gui_manual', source_label: str = 'manual sync',
                           file_name: str | None = None, file_sha256: str | None = None) -> dict:
        """Upsert content_items by (platform, external_id) and record their metrics.

        Each item: content_items columns (external_id required, content_type on first
        insert) plus optional "metrics": {metric_key or GUI label: value} and optional
        "period": {"period_kind", "period_start", "period_end"} overriding period_kind.
        full_snapshot=True marks this account's content missing from `items` as deleted.
        """
        stats = {'content_upserted': 0, 'facts_inserted': 0, 'unknown_metrics': set(), 'marked_deleted': 0}
        platform = await account_dao.get_platform(db, account_id)
        metric_ids = await metric_dao.lookup(db, platform, 'content')
        batch_id = await batch_dao.create(db, account_id, source_kind, source_label,
                                          file_name=file_name, file_sha256=file_sha256)
        for item in items:
            item = dict(item)
            metrics = item.pop('metrics', None) or {}
            period = item.pop('period', None) or {'period_kind': period_kind}
            if not item.get('external_id'):
                raise errors.RequestError(msg=f'item without external_id: {item}')
            item.setdefault('content_type', default_content_type)
            if item['content_type'] is None:
                raise errors.RequestError(msg=f"item {item['external_id']} needs content_type")
            fields = {k: v for k, v in item.items() if k not in MANAGED}
            content_id = await content_dao.upsert(db, account_id, platform, fields)
            stats['content_upserted'] += 1
            for name, value in metrics.items():
                metric_id = metric_dao.resolve(metric_ids, name)
                if metric_id is None:
                    stats['unknown_metrics'].add(name)
                elif value is not None:
                    stats['facts_inserted'] += await metric_dao.add_content_fact(
                        db, content_id, metric_id, period, value, batch_id)
        if full_snapshot:
            stats['marked_deleted'] = await content_dao.mark_unseen_deleted(db, account_id)
        await batch_dao.set_row_count(db, batch_id, len(items))
        return {'batch_id': batch_id, **stats, 'unknown_metrics': sorted(stats['unknown_metrics'])}

    @staticmethod
    async def sync_account_metrics(*, db: AsyncSession, account_id: int, rows: list[dict], scope: str = 'account',
                                   source_kind: str = 'gui_manual', source_label: str = 'manual sync',
                                   file_name: str | None = None, file_sha256: str | None = None) -> dict:
        """Each row: {"metric": key or GUI label, "value": n, "period_start": date,
        "period_end": date (defaults to start), "period_kind": "day" (default)}."""
        inserted, unknown = 0, set()
        platform = await account_dao.get_platform(db, account_id)
        metric_ids = await metric_dao.lookup(db, platform, scope)
        starts = [parse_date(r['period_start']) for r in rows if r.get('period_start')]
        batch_id = await batch_dao.create(db, account_id, source_kind, source_label, file_name=file_name,
                                          file_sha256=file_sha256, row_count=len(rows),
                                          range_start=min(starts, default=None), range_end=max(starts, default=None))
        for r in rows:
            metric_id = metric_dao.resolve(metric_ids, r['metric'])
            if metric_id is None:
                unknown.add(r['metric'])
                continue
            inserted += await metric_dao.add_account_fact(db, account_id, metric_id, r, batch_id)
        return {'batch_id': batch_id, 'facts_inserted': inserted, 'unknown_metrics': sorted(unknown)}

    @staticmethod
    async def sync_relationships(*, db: AsyncSession, account_id: int, relation: str, people: list[dict],
                                 full_snapshot: bool = True, source_kind: str = 'gui_manual',
                                 source_label: str = 'manual sync') -> dict:
        """Upsert people + relationships. With full_snapshot, anyone previously observed
        with this relation but absent now gets ended_inferred_at (inferred unfollow)."""
        try:
            relation = Relation(relation)
        except ValueError as e:
            raise errors.RequestError(msg=f'relation must be one of {[r.value for r in Relation]}') from e
        new = ended = 0
        platform = await account_dao.get_platform(db, account_id)
        batch_id = await batch_dao.create(db, account_id, source_kind, source_label, row_count=len(people))
        for p in people:
            if not p.get('handle'):
                raise errors.RequestError(msg=f'person without handle: {p}')
            person_id = await relationship_dao.upsert_person(db, platform, p)
            new += await relationship_dao.observe(db, account_id, person_id, relation, p.get('relation_since'), batch_id)
        if full_snapshot:
            ended = await relationship_dao.end_unseen(db, account_id, relation)
        return {'batch_id': batch_id, 'observed': len(people), 'new': new, 'ended_inferred': ended}


sync_service = SyncService()
