"""What an agent needs to draft briefs: the posts still missing one, and the words already used to describe posts."""

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

from app.creator.model import ContentBrief, ContentItem, ContentTag

# Free-text brief fields that "What worked" groups on; reusing existing spellings keeps those groups whole.
VOCABULARY_FIELDS = ('topic', 'content_pillar', 'target_audience', 'hook_type', 'hook_technique', 'narrative_structure',
                     'editing_style', 'editing_rhythm', 'writing_style', 'writing_structure', 'formatting')


class BriefService:
    @staticmethod
    async def needing_briefs(*, db: AsyncSession, account_id: int | None = None, limit: int = 50) -> list[dict]:
        """Published posts (not plans, not removed) with no brief yet, newest first, with their text and hashtags."""
        tags = (sa.select(sa.func.array_agg(ContentTag.value))
                .where(ContentTag.content_id == ContentItem.content_id, ContentTag.tag_type == 'hashtag')
                .scalar_subquery())
        stmt = (sa.select(ContentItem.content_id, ContentItem.account_id, ContentItem.platform, ContentItem.content_type,
                          ContentItem.title, ContentItem.caption, ContentItem.url, ContentItem.published_at,
                          ContentItem.language, tags.label('hashtags'))
                .where(~sa.exists().where(ContentBrief.content_id == ContentItem.content_id),
                       ContentItem.visibility != 'draft', ContentItem.deleted_observed_at.is_(None))
                .order_by(ContentItem.published_at.desc().nulls_last())
                .limit(min(limit, 200)))
        if account_id is not None:
            stmt = stmt.where(ContentItem.account_id == account_id)
        return [dict(r) for r in (await db.execute(stmt)).mappings()]

    @staticmethod
    async def vocabulary(*, db: AsyncSession) -> dict[str, list[dict]]:
        """Values already used per free-text brief field, most used first: {"hook_type": [{"value": "question", "posts": 4}]}."""
        out = {}
        for field in VOCABULARY_FIELDS:
            col = ContentBrief.__table__.c[field]
            rows = await db.execute(sa.select(col, sa.func.count()).where(col.is_not(None), col != '')
                                    .group_by(col).order_by(sa.func.count().desc(), col))
            out[field] = [{'value': v, 'posts': n} for v, n in rows]
        return out


brief_service = BriefService()
