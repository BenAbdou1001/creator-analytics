"""File imports: platform CSV exports, and the LinkedIn analytics .xlsx (detected by its zip header)."""

import csv
import hashlib
import io

from sqlalchemy.ext.asyncio import AsyncSession

from app.creator.crud.crud_batch import batch_dao
from app.creator.service.linkedin_service import linkedin_service
from app.creator.service.sync_service import sync_service
from app.creator.utils.parse import num
from common.exception import errors

_CONTENT_ALIASES = {
    'external_id': ['external_id', 'content', 'video id', 'video', 'post id', 'id', 'media id', 'post url'],
    'title': ['title', 'video title', 'post title', 'post'],
    'published_at': ['published_at', 'video publish time', 'publish time', 'date posted', 'posted', 'created'],
    'url': ['url', 'link', 'permalink'],
    'duration_seconds': ['duration_seconds', 'duration'],
    'content_type': ['content_type', 'type'],
    'caption': ['caption', 'description'],
}
_DATE_ALIASES = ['period_start', 'date', 'day']


def detect_kind(data: bytes) -> str:
    """'content' for one row per post, 'account_metrics' for one row per date, from the CSV header."""
    headers = next(csv.reader(io.StringIO(data.decode('utf-8-sig'))), [])
    low = {h.strip().lower() for h in headers}
    if low & set(_CONTENT_ALIASES['external_id']):
        return 'content'
    if low & set(_DATE_ALIASES):
        return 'account_metrics'
    raise errors.RequestError(msg=f'This file has no post ID column and no date column. Columns found: {", ".join(headers)}')


class ImportService:
    async def preview(self, *, db: AsyncSession, account_id: int, kind: str, data: bytes, file_name: str | None = None,
                      default_content_type: str | None = None, period_kind: str = 'day') -> dict:
        """Runs the real import on `db`, then rolls back, so the numbers are exact and nothing is stored."""
        file_kind = 'linkedin_xlsx' if data[:2] == b'PK' else detect_kind(data) if kind == 'auto' else kind
        seen = await batch_dao.last_import_of(db, account_id, hashlib.sha256(data).hexdigest())
        result = await self.import_file(db=db, account_id=account_id, kind=file_kind, data=data, file_name=file_name,
                                        default_content_type=default_content_type, period_kind=period_kind)
        await db.rollback()
        return {'kind': file_kind, 'already_imported_at': seen, 'result': result}

    async def import_file(self, *, db: AsyncSession, account_id: int, kind: str, data: bytes,
                          file_name: str | None = None, default_content_type: str | None = None,
                          period_kind: str = 'day') -> dict:
        if data[:2] == b'PK':
            return await linkedin_service.import_xlsx(db=db, account_id=account_id, data=data, file_name=file_name)
        return await self.import_csv(db=db, account_id=account_id, kind=detect_kind(data) if kind == 'auto' else kind,
                                     data=data, file_name=file_name,
                                     default_content_type=default_content_type, period_kind=period_kind)

    @staticmethod
    async def import_csv(*, db: AsyncSession, account_id: int, kind: str, data: bytes, file_name: str | None = None,
                         default_content_type: str | None = None, period_kind: str = 'day') -> dict:
        """kind='content': one row per post, metric columns become lifetime content facts.
        kind='account_metrics': one row per date, metric columns become account facts."""
        reader = csv.DictReader(io.StringIO(data.decode('utf-8-sig')))
        headers = {h: h.strip().lower() for h in reader.fieldnames or []}
        common = {'source_kind': 'csv_export', 'source_label': f'CSV import ({kind})',
                  'file_name': file_name, 'file_sha256': hashlib.sha256(data).hexdigest()}

        def pick(aliases):
            return next((h for h, low in headers.items() if low in aliases), None)

        if kind == 'account_metrics':
            date_col = pick(_DATE_ALIASES)
            if date_col is None:
                raise errors.RequestError(msg=f'no date column (one of {_DATE_ALIASES}) in {list(headers)}')
            end_col = pick(['period_end'])
            rows = []
            for r in reader:
                if not r[date_col] or r[date_col].strip().lower() == 'total':
                    continue
                for h in headers:
                    if h in (date_col, end_col) or (value := num(r[h])) is None:
                        continue
                    rows.append({'metric': h.strip(), 'value': value, 'period_kind': period_kind,
                                 'period_start': r[date_col], 'period_end': r[end_col] if end_col else None})
            return await sync_service.sync_account_metrics(db=db, account_id=account_id, rows=rows, **common)

        if kind == 'content':
            field_cols = {f: c for f, aliases in _CONTENT_ALIASES.items() if (c := pick(aliases))}
            if 'external_id' not in field_cols:
                raise errors.RequestError(
                    msg=f"no id column (one of {_CONTENT_ALIASES['external_id']}) in {list(headers)}")
            items = []
            for r in reader:
                ext = (r[field_cols['external_id']] or '').strip()
                if not ext or ext.lower() == 'total':
                    continue
                item = {f: (r[c].strip() or None) for f, c in field_cols.items()}
                if 'duration_seconds' in item:
                    item['duration_seconds'] = num(item['duration_seconds'] or '')
                item['metrics'] = {h.strip(): v for h in headers
                                   if h not in field_cols.values() and (v := num(r[h])) is not None}
                items.append(item)
            return await sync_service.sync_content(db=db, account_id=account_id, items=items,
                                                    default_content_type=default_content_type, **common)

        raise errors.RequestError(msg="kind must be 'content' or 'account_metrics'")


import_service = ImportService()
