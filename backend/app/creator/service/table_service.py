from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.creator.crud.crud_catalog import catalog_dao
from app.creator.crud.crud_table import table_dao
from common.exception import errors


class TableService:
    @staticmethod
    def schema() -> dict:
        return catalog_dao.schema()

    @staticmethod
    async def list(*, db: AsyncSession, table: str, filters: dict | None = None, limit: int = 100, offset: int = 0,
                   order_by: str | None = None, desc: bool = True) -> dict:
        return await table_dao.select(db, table, filters, limit, offset, order_by, desc)

    @staticmethod
    async def create(*, db: AsyncSession, table: str, rows: list[dict]) -> list[dict]:
        return [await table_dao.insert(db, table, row) for row in rows]

    @staticmethod
    async def update(*, db: AsyncSession, table: str, key: dict, data: dict) -> dict:
        row = await table_dao.update(db, table, key, data)
        if row is None:
            raise errors.NotFoundError(msg=f'no {table} row with {key}')
        return row

    @staticmethod
    async def delete(*, db: AsyncSession, table: str, key: dict) -> dict:
        row = await table_dao.delete(db, table, key)
        if row is None:
            raise errors.NotFoundError(msg=f'no {table} row with {key}')
        return row


table_service = TableService()
