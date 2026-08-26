import time
import uuid
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

# Configure professional logger
logger = logging.getLogger("dirogsa.api")
logger.setLevel(logging.INFO)

# Avoid adding multiple handlers if already set
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        "[%(asctime)s] %(levelname)s [%(name)s] %(message)s", 
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())[:8]
        request.state.request_id = request_id
        
        # We only want to log specific paths to avoid noise (e.g. /shop, /api)
        path = request.url.path
        if not path.startswith(("/shop", "/api", "/product-brands")):
            return await call_next(request)
            
        start_time = time.time()
        
        try:
            response = await call_next(request)
            process_time = (time.time() - start_time) * 1000
            
            # Formateamos el log de manera concisa
            method = request.method
            query_string = request.url.query
            query_suffix = f"?{query_string}" if query_string else ""
            status = response.status_code
            
            log_msg = f"[req={request_id}] {method} {path}{query_suffix} | status={status} | {process_time:.2f}ms"
            
            if status >= 500:
                logger.error(log_msg)
            elif status >= 400:
                logger.warning(log_msg)
            else:
                # Log WARNING if it takes more than 1000ms
                if process_time > 1000:
                    logger.warning(f"{log_msg} | SLOW_REQUEST")
                else:
                    logger.info(log_msg)
                    
            # Inject request ID into headers for frontend debugging
            response.headers["X-Request-ID"] = request_id
            return response
            
        except Exception as e:
            process_time = (time.time() - start_time) * 1000
            logger.error(f"[req={request_id}] {request.method} {path} | ERROR: {str(e)} | {process_time:.2f}ms")
            raise
