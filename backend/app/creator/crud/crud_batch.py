from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

from app.creator.model import ImportBatch


class CRUDImportBatch:
    @staticmethod
    async def create(db: AsyncSession, account_id: int, source_kind: str, source_label: str, **extra) -> int:
        batch = ImportBatch(account_id=account_id, source_kind=source_kind, source_label=source_label,
                            **{k: v for k, v in extra.items() if v is not None})
        db.add(batch)
        await db.flush()
        return batch.batch_id

    @staticmethod
    async def set_row_count(db: AsyncSession, batch_id: int, row_count: int) -> None:
        await db.execute(sa.update(ImportBatch).where(ImportBatch.batch_id == batch_id).values(row_count=row_count))

    @staticmethod
    async def last_import_of(db: AsyncSession, account_id: int, file_sha256: str) -> datetime | None:
        return await db.scalar(sa.select(sa.func.max(ImportBatch.imported_at)).where(
            ImportBatch.account_id == account_id, ImportBatch.file_sha256 == file_sha256))


batch_dao = CRUDImportBatch()
