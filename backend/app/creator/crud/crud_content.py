import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.creator.crud.crud_catalog import catalog_dao
from app.creator.model import ContentItem

# columns sync owns; callers can't set them
MANAGED = {'content_id', 'account_id', 'platform', 'first_seen_at', 'last_seen_at', 'deleted_observed_at'}


class CRUDContent:
    @staticmethod
    async def upsert(db: AsyncSession, account_id: int, platform: str, fields: dict) -> int:
        """Insert or update by (platform, external_id); a re-seen item is no longer considered deleted."""
        values = catalog_dao.values(ContentItem.__table__, {'account_id': account_id, 'platform': platform, **fields})
        stmt = insert(ContentItem).values(values)
        stmt = stmt.on_conflict_do_update(
            index_elements=[ContentItem.platform, ContentItem.external_id],
            set_={**{k: stmt.excluded[k] for k in fields}, 'last_seen_at': sa.func.now(), 'deleted_observed_at': None},
        ).returning(ContentItem.content_id)
        return (await db.execute(stmt)).scalar_one()

    @staticmethod
    async def mark_unseen_deleted(db: AsyncSession, account_id: int) -> int:
        """Content not touched in this transaction (now() is the transaction start) is flagged deleted."""
        stmt = (sa.update(ContentItem)
                .where(ContentItem.account_id == account_id, ContentItem.deleted_observed_at.is_(None),
                       ContentItem.last_seen_at < sa.func.now())
                .values(deleted_observed_at=sa.func.now()))
        return (await db.execute(stmt)).rowcount

    @staticmethod
    async def types_by_external_id(db: AsyncSession, account_id: int) -> dict[str, str]:
        rows = await db.execute(sa.select(ContentItem.external_id, ContentItem.content_type)
                                .where(ContentItem.account_id == account_id))
        return dict(rows.tuples().all())


content_dao = CRUDContent()
