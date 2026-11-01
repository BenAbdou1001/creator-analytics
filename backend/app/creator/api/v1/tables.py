from typing import Any

from fastapi import APIRouter, Request

from app.creator.schema.table import GetRowPage
from app.creator.service.table_service import table_service
from common.response.response_code import CustomResponseCode
from common.response.response_schema import ResponseModel, ResponseSchemaModel, response_base
from database.db import CurrentSession, CurrentSessionTransaction

router = APIRouter()

_PAGING = {'limit', 'offset', 'order_by', 'desc'}


@router.get('/{table}', summary='List rows; any other query param is a filter (col or col__op)')
async def list_rows(db: CurrentSession, table: str, request: Request, limit: int = 100, offset: int = 0,
                    order_by: str | None = None, desc: bool = True) -> ResponseSchemaModel[GetRowPage]:
    filters = {k: v for k, v in request.query_params.items() if k not in _PAGING}
    data = await table_service.list(db=db, table=table, filters=filters, limit=limit, offset=offset,
                                    order_by=order_by, desc=desc)
    return response_base.success(data=data)


@router.post('/{table}', summary='Insert one row, or a list of rows in one transaction', status_code=201)
async def create_rows(db: CurrentSessionTransaction, table: str,
                      body: dict[str, Any] | list[dict[str, Any]]) -> ResponseModel:
    rows = await table_service.create(db=db, table=table, rows=body if isinstance(body, list) else [body])
    return response_base.success(res=CustomResponseCode.HTTP_201, data=rows if isinstance(body, list) else rows[0])


@router.patch('/{table}', summary='Update one row; its primary key goes in the query string')
async def update_row(db: CurrentSessionTransaction, table: str, request: Request, body: dict[str, Any]) -> ResponseModel:
    data = await table_service.update(db=db, table=table, key=dict(request.query_params), data=body)
    return response_base.success(data=data)


@router.delete('/{table}', summary='Delete one row; its primary key goes in the query string')
async def delete_row(db: CurrentSessionTransaction, table: str, request: Request) -> ResponseModel:
    return response_base.success(data=await table_service.delete(db=db, table=table, key=dict(request.query_params)))
