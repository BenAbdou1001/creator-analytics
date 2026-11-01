"""Generic CRUD over any table/view, addressed by name (validated against the catalogue)."""

import operator

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

from app.creator.crud.crud_catalog import catalog_dao
from common.exception import errors

_OPS = {'eq': operator.eq, 'ne': operator.ne, 'gt': operator.gt, 'gte': operator.ge,
        'lt': operator.lt, 'lte': operator.le}


class CRUDTable:
    @staticmethod
    async def select(db: AsyncSession, table: str, filters: dict | None, limit: int, offset: int,
                     order_by: str | None, desc: bool) -> dict:
        """filters: {"col": v} or {"col__op": v}, op in eq|ne|gt|gte|lt|lte|like|isnull."""
        t = catalog_dao.table(table)
        where = []
        for k, v in (filters or {}).items():
            name, _, op = k.partition('__')
            col = catalog_dao.column(t, name)
            op = op or 'eq'
            if op == 'isnull':
                where.append(col.is_(None) if str(v).lower() in ('1', 'true', 'yes') else col.is_not(None))
            elif op == 'like':
                where.append(sa.cast(col, sa.Text).ilike(f'%{v}%'))
            elif op in _OPS:
                where.append(_OPS[op](col, catalog_dao.coerce(col, v)))
            else:
                raise errors.RequestError(msg=f'unknown filter operator {op!r}')
        pk = list(t.primary_key.columns)
        order_col = catalog_dao.column(t, order_by) if order_by else (pk[0] if pk else list(t.columns)[0])
        order = order_col.desc().nulls_last() if desc else order_col.asc().nulls_last()
        rows = await db.execute(sa.select(t).where(*where).order_by(order).limit(min(limit, 1000)).offset(offset))
        total = await db.scalar(sa.select(sa.func.count()).select_from(t).where(*where))
        return {'rows': [dict(r) for r in rows.mappings()], 'total': total}

    @staticmethod
    async def insert(db: AsyncSession, table: str, row: dict) -> dict:
        t = catalog_dao.table(table, write=True)
        result = await db.execute(sa.insert(t).values(catalog_dao.values(t, row)).returning(t))
        return dict(result.mappings().one())

    @staticmethod
    async def update(db: AsyncSession, table: str, key: dict, data: dict) -> dict | None:
        t = catalog_dao.table(table, write=True)
        if not data:
            raise errors.RequestError(msg='nothing to update')
        stmt = sa.update(t).where(catalog_dao.key_clause(t, key)).values(catalog_dao.values(t, data)).returning(t)
        row = (await db.execute(stmt)).mappings().one_or_none()
        return dict(row) if row else None

    @staticmethod
    async def delete(db: AsyncSession, table: str, key: dict) -> dict | None:
        t = catalog_dao.table(table, write=True)
        row = (await db.execute(sa.delete(t).where(catalog_dao.key_clause(t, key)).returning(t))).mappings().one_or_none()
        return dict(row) if row else None


table_dao = CRUDTable()
