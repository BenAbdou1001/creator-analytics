from typing import Any

from common.response.response_code import StandardResponseCode


class BaseExceptionError(Exception):
    """Raised by services/crud; turned into a {"code", "msg", "data"} response by the exception handler."""

    code: int

    def __init__(self, *, msg: str | None = None, data: Any = None) -> None:
        self.msg = msg
        self.data = data
        super().__init__(msg)  # so the MCP server shows the message too


class RequestError(BaseExceptionError):
    code = StandardResponseCode.HTTP_400


class NotFoundError(BaseExceptionError):
    code = StandardResponseCode.HTTP_404


class ConflictError(BaseExceptionError):
    code = StandardResponseCode.HTTP_409
