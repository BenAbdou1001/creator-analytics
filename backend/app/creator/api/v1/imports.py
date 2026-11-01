from typing import Annotated

from fastapi import APIRouter, File, Form, UploadFile

from app.creator.service.import_service import import_service
from common.response.response_schema import ResponseModel, response_base
from database.db import CurrentSessionTransaction

router = APIRouter()


@router.post('', summary='Import a platform CSV export or the LinkedIn analytics .xlsx (auto-detected)')
async def import_file(db: CurrentSessionTransaction, file: Annotated[UploadFile, File()],
                      account_id: Annotated[int, Form()], kind: Annotated[str, Form()] = 'content',
                      default_content_type: Annotated[str | None, Form()] = None,
                      period_kind: Annotated[str, Form()] = 'day') -> ResponseModel:
    data = await import_service.import_file(db=db, account_id=account_id, kind=kind, data=await file.read(),
                                            file_name=file.filename, default_content_type=default_content_type or None,
                                            period_kind=period_kind)
    return response_base.success(data=data)
