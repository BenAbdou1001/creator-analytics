from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy import exc as sa_exc
from starlette.exceptions import HTTPException

from common.exception.errors import BaseExceptionError
from common.response.response_code import StandardResponseCode


def _response(status: int, msg: str, data=None) -> JSONResponse:
    return JSONResponse({'code': status, 'msg': msg, 'data': data}, status_code=status)


def _db_message(exc: sa_exc.DBAPIError) -> str:
    diag = getattr(exc.orig, 'diag', None)
    return (diag and (diag.message_detail or diag.message_primary)) or str(exc.orig)


def register_exception(app: FastAPI) -> None:
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        return _response(exc.status_code, str(exc.detail))

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        errors = [{k: v for k, v in e.items() if k in ('loc', 'msg', 'type')} for e in exc.errors()]
        first = errors[0] if errors else {}
        msg = f"{'.'.join(map(str, first.get('loc', ())))}: {first.get('msg', 'invalid request')}"
        return _response(StandardResponseCode.HTTP_422, msg, errors)

    @app.exception_handler(BaseExceptionError)
    async def custom_exception_handler(request: Request, exc: BaseExceptionError):
        return _response(exc.code, exc.msg or 'error', exc.data)

    @app.exception_handler(sa_exc.IntegrityError)
    async def integrity_error_handler(request: Request, exc: sa_exc.IntegrityError):
        return _response(StandardResponseCode.HTTP_409, _db_message(exc))

    @app.exception_handler(sa_exc.DBAPIError)
    async def db_error_handler(request: Request, exc: sa_exc.DBAPIError):
        # bad casts, check constraints... are caller errors
        return _response(StandardResponseCode.HTTP_400, _db_message(exc))

    @app.exception_handler(sa_exc.StatementError)
    async def statement_error_handler(request: Request, exc: sa_exc.StatementError):
        # raised before reaching Postgres, e.g. a value SQLAlchemy can't bind
        return _response(StandardResponseCode.HTTP_400, str(exc.orig))
