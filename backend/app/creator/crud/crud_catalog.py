"""The catalogue of every table/view, read from the SQLAlchemy metadata.

Generic CRUD is driven by this, so identifiers only ever come from the models and values are
coerced to each column's Python type before they are bound.
"""

from datetime import date, datetime
from enum import Enum
from functools import cache
from typing import Any

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

import app.creator.model  # noqa: F401  registers every model on the metadata
from app.creator.utils.parse import parse_date, parse_datetime
from common.exception import errors
from common.model import MappedBase

_PG = postgresql.dialect()


def _type_name(t: sa.types.TypeEngine) -> str:
    if isinstance(t, sa.Enum):
        return t.name
    if isinstance(t, postgresql.ARRAY):
        return f'{_type_name(t.item_type)}[]'
    return t.compile(dialect=_PG).lower()


def _enum_types():
    for table in MappedBase.metadata.tables.values():
        for col in table.columns:
            t = col.type.item_type if isinstance(col.type, postgresql.ARRAY) else col.type
            if isinstance(t, sa.Enum):
                yield t


class CRUDCatalog:
    @staticmethod
    def tables() -> dict[str, sa.Table]:
        return {t.name: t for t in MappedBase.metadata.tables.values()}

    @staticmethod
    @cache
    def schema() -> dict:
        tables = {}
        for t in sorted(MappedBase.metadata.tables.values(), key=lambda t: t.name):
            tables[t.name] = {
                'view': bool(t.info.get('is_view')),
                'columns': [{
                    'name': c.name,
                    'type': _type_name(c.type),
                    'required': not c.nullable,
                    'default': ('autoincrement' if c is t.autoincrement_column
                                else str(c.server_default.arg) if c.server_default is not None else None),
                } for c in t.columns],
                'pk': [c.name for c in t.primary_key.columns],
            }
        enums = {e.name: list(e.enums) for e in _enum_types()}
        return {'tables': tables, 'enums': dict(sorted(enums.items()))}

    def table(self, name: str, write: bool = False) -> sa.Table:
        t = self.tables().get(name)
        if t is None:
            raise errors.NotFoundError(msg=f'unknown table or view: {name}')
        if write and t.info.get('is_view'):
            raise errors.RequestError(msg=f'{name} is a read-only view')
        return t

    @staticmethod
    def column(table: sa.Table, name: str) -> sa.Column:
        if name not in table.columns:
            raise errors.RequestError(msg=f'unknown column {name!r} for {table.name}')
        return table.columns[name]

    @staticmethod
    def coerce(column: sa.Column, value: Any) -> Any:
        """Plain JSON / query-string values -> the column's Python type (dates, enums, numbers...)."""
        if value is None:
            return None
        try:
            py = column.type.python_type
        except NotImplementedError:  # JSONB, ARRAY...
            return value
        try:
            if issubclass(py, Enum):
                return py(value)
            if py is bool and isinstance(value, str):
                return value.lower() in ('1', 'true', 'yes')
            if py in (int, float) and isinstance(value, str):
                return py(value)
            if py is datetime and isinstance(value, str):
                return parse_datetime(value)
            if py is date and isinstance(value, str):
                return parse_date(value)
        except ValueError as e:
            raise errors.RequestError(msg=f'{column.name}: invalid value {value!r}') from e
        return value

    def values(self, table: sa.Table, data: dict) -> dict:
        return {k: self.coerce(self.column(table, k), v) for k, v in data.items()}

    def key_clause(self, table: sa.Table, key: dict) -> sa.ColumnElement[bool]:
        pk = [c.name for c in table.primary_key.columns]
        if not pk or set(key) != set(pk):
            raise errors.RequestError(msg=f'{table.name} rows are addressed by exactly {pk}, got {sorted(key)}')
        return sa.and_(*(table.c[k] == v for k, v in self.values(table, key).items()))


catalog_dao = CRUDCatalog()
