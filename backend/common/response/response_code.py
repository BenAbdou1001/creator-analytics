from enum import Enum


class CustomResponseCode(Enum):
    HTTP_200 = (200, 'Success')
    HTTP_201 = (201, 'Created')
    HTTP_400 = (400, 'Bad request')

    @property
    def code(self) -> int:
        return self.value[0]

    @property
    def msg(self) -> str:
        return self.value[1]


class StandardResponseCode:
    HTTP_200 = 200
    HTTP_201 = 201
    HTTP_400 = 400
    HTTP_404 = 404
    HTTP_409 = 409
    HTTP_422 = 422
    HTTP_500 = 500
