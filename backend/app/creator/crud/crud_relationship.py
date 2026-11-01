import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.creator.model import Person, Relationship
from app.creator.utils.parse import parse_date


class CRUDRelationship:
    @staticmethod
    async def upsert_person(db: AsyncSession, platform: str, p: dict) -> int:
        fields = {k: p.get(k) for k in ('display_name', 'external_id', 'headline', 'profile_url')}
        stmt = insert(Person).values(platform=platform, handle=p['handle'], **fields)
        stmt = stmt.on_conflict_do_update(  # keep what we knew when the new snapshot lacks a field
            index_elements=[Person.platform, Person.handle],
            set_={k: sa.func.coalesce(stmt.excluded[k], Person.__table__.c[k]) for k in fields},
        ).returning(Person.person_id)
        return (await db.execute(stmt)).scalar_one()

    @staticmethod
    async def observe(db: AsyncSession, account_id: int, person_id: int, relation: str, since, batch_id: int) -> bool:
        """Record the relation as seen in this batch; returns True when it is new."""
        stmt = insert(Relationship).values(
            account_id=account_id, person_id=person_id, relation=relation,
            relation_since=parse_date(since),
            first_batch_id=batch_id, last_batch_id=batch_id)
        stmt = stmt.on_conflict_do_update(
            index_elements=[Relationship.account_id, Relationship.person_id, Relationship.relation],
            set_={'last_batch_id': stmt.excluded.last_batch_id, 'last_observed_at': sa.func.now(),
                  'ended_inferred_at': None,
                  'relation_since': sa.func.coalesce(stmt.excluded.relation_since, Relationship.relation_since)},
        ).returning(sa.literal_column('xmax = 0'))  # xmax is 0 only for freshly inserted rows
        return (await db.execute(stmt)).scalar_one()

    @staticmethod
    async def end_unseen(db: AsyncSession, account_id: int, relation: str) -> int:
        """Relations not observed in this transaction get ended_inferred_at (inferred unfollow)."""
        stmt = (sa.update(Relationship)
                .where(Relationship.account_id == account_id, Relationship.relation == relation,
                       Relationship.ended_inferred_at.is_(None), Relationship.last_observed_at < sa.func.now())
                .values(ended_inferred_at=sa.func.now()))
        return (await db.execute(stmt)).rowcount


relationship_dao = CRUDRelationship()
