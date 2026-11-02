import sqlalchemy as sa
from fastapi import APIRouter

from app.creator.service.table_service import table_service
from common.response.response_schema import ResponseModel, response_base
from database.db import CurrentSession

router = APIRouter()


@router.get('/health', summary='Database reachable')
async def health(db: CurrentSession) -> ResponseModel:
    await db.execute(sa.text('SELECT 1'))
    return response_base.success(data={'ok': True})


@router.get('/schema', summary='Tables, columns, primary keys and enum values')
async def get_schema() -> ResponseModel:
    return response_base.success(data=table_service.schema())
