from fastapi import APIRouter

from app.creator.schema.sync import (
    SyncAccountMetricsParam,
    SyncAccountMetricsResult,
    SyncContentParam,
    SyncContentResult,
    SyncRelationshipsParam,
    SyncRelationshipsResult,
)
from app.creator.service.sync_service import sync_service
from common.response.response_schema import ResponseSchemaModel, response_base
from database.db import CurrentSessionTransaction

router = APIRouter()


@router.post('/content', summary='Upsert posts/videos and record a metrics snapshot')
async def sync_content(db: CurrentSessionTransaction, obj: SyncContentParam) -> ResponseSchemaModel[SyncContentResult]:
    return response_base.success(data=await sync_service.sync_content(db=db, **obj.model_dump()))


@router.post('/account-metrics', summary='Record account-level metric values')
async def sync_account_metrics(db: CurrentSessionTransaction,
                               obj: SyncAccountMetricsParam) -> ResponseSchemaModel[SyncAccountMetricsResult]:
    return response_base.success(data=await sync_service.sync_account_metrics(db=db, **obj.model_dump()))


@router.post('/relationships', summary='Sync a follower/subscriber/connection list')
async def sync_relationships(db: CurrentSessionTransaction,
                             obj: SyncRelationshipsParam) -> ResponseSchemaModel[SyncRelationshipsResult]:
    return response_base.success(data=await sync_service.sync_relationships(db=db, **obj.model_dump()))
