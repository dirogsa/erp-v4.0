from pydantic import BaseModel
from typing import List, Generic, TypeVar, Any

T = TypeVar("T")

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    pages: int
    size: int
