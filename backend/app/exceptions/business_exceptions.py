class BusinessException(Exception):
    """Base class for business logic exceptions"""
    def __init__(self, message: str, code: str, details: dict = None):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)

class NotFoundException(BusinessException):
    def __init__(self, entity: str, entity_id: str):
        super().__init__(
            f"{entity} with id {entity_id} not found",
            "NOT_FOUND",
            {"entity": entity, "id": entity_id}
        )

class ValidationException(BusinessException):
    def __init__(self, message: str, details: dict = None):
        super().__init__(
            message,
            "VALIDATION_ERROR",
            details
        )

class InsufficientStockException(BusinessException):
    def __init__(self, product_sku: str, available: int, required: int):
        super().__init__(
            f"Insufficient stock for product {product_sku}",
            "INSUFFICIENT_STOCK",
            {
                "product_sku": product_sku,
                "available": available,
                "required": required
            }
        )

class DuplicateEntityException(BusinessException):
    def __init__(self, entity: str, field: str, value: str):
        super().__init__(
            f"{entity} with {field} '{value}' already exists",
            "DUPLICATE_ENTITY",
            {"entity": entity, "field": field, "value": value}
        )
