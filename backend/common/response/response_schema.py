from typing import Any

from pydantic import BaseModel, Field

from common.response.response_code import CustomResponseCode


class ResponseModel(BaseModel):
    """Envelope for every API response: {"code", "msg", "data"}."""

    code: int = Field(CustomResponseCode.HTTP_200.code, description='Status code')
    msg: str = Field(CustomResponseCode.HTTP_200.msg, description='Message')
    data: Any | None = Field(None, description='Payload')


class ResponseSchemaModel[SchemaT](ResponseModel):
    data: SchemaT


class ResponseBase:
    @staticmethod
    def success(*, res: CustomResponseCode = CustomResponseCode.HTTP_200, data: Any = None) -> ResponseModel:
        return ResponseModel(code=res.code, msg=res.msg, data=data)

    @staticmethod
    def fail(*, res: CustomResponseCode = CustomResponseCode.HTTP_400, data: Any = None) -> ResponseModel:
        return ResponseModel(code=res.code, msg=res.msg, data=data)


response_base = ResponseBase()
