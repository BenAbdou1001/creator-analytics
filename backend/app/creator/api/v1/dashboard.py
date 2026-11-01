from datetime import date

from fastapi import APIRouter

from app.creator.schema.dashboard import GetAccountOverview, GetMetricPoint
from app.creator.service.dashboard_service import dashboard_service
from common.response.response_schema import ResponseSchemaModel, response_base
from database.db import CurrentSession

router = APIRouter()


@router.get('/overview', summary='Per-account headline numbers')
async def overview(db: CurrentSession) -> ResponseSchemaModel[list[GetAccountOverview]]:
    return response_base.success(data=await dashboard_service.overview(db=db))


@router.get('/timeseries', summary='One account-level metric over time')
async def timeseries(db: CurrentSession, account_id: int, metric_key: str, start: date | None = None,
                     end: date | None = None, period_kind: str = 'day') -> ResponseSchemaModel[list[GetMetricPoint]]:
    data = await dashboard_service.timeseries(db=db, account_id=account_id, metric_key=metric_key, start=start,
                                              end=end, period_kind=period_kind)
    return response_base.success(data=data)
