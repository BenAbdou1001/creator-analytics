from fastapi import APIRouter

from app.creator.api.v1.dashboard import router as dashboard_router
from app.creator.api.v1.imports import router as imports_router
from app.creator.api.v1.meta import router as meta_router
from app.creator.api.v1.sync import router as sync_router
from app.creator.api.v1.tables import router as tables_router

router = APIRouter()

router.include_router(meta_router, tags=['Meta'])
router.include_router(tables_router, prefix='/tables', tags=['Tables'])
router.include_router(sync_router, prefix='/sync', tags=['Sync'])
router.include_router(imports_router, prefix='/imports', tags=['Imports'])
router.include_router(dashboard_router, prefix='/dashboard', tags=['Dashboard'])
