from fastapi import Request, status
from fastapi.responses import JSONResponse
from .business_exceptions import BusinessException

async def business_exception_handler(request: Request, exc: BusinessException):
    status_code = status.HTTP_400_BAD_REQUEST
    
    if exc.code == "NOT_FOUND":
        status_code = status.HTTP_404_NOT_FOUND
    elif exc.code == "VALIDATION_ERROR":
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    elif exc.code == "DUPLICATE_ENTITY":
        status_code = status.HTTP_409_CONFLICT
        
    return JSONResponse(
        status_code=status_code,
        content={
            "error": exc.code,
            "message": exc.message,
            "details": exc.details
        }
    )
