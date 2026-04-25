import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.exceptions.business_exceptions import BusinessException
from app.exceptions.handlers import business_exception_handler
from app.core.config import settings
from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import time

app = FastAPI(title="ERP System API", version="1.0.0")

app.add_exception_handler(BusinessException, business_exception_handler)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    print("\n" + "="*50)
    print(f"❌ ERROR DE VALIDACIÓN EN: {request.method} {request.url.path}")
    for error in errors:
        loc = " -> ".join([str(x) for x in error.get("loc", [])])
        msg = error.get("msg")
        tipo = error.get("type")
        print(f"   - Campo: {loc}")
        print(f"     Error: {msg}")
        print(f"     Tipo:  {tipo}")
    print("="*50 + "\n")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": errors,
            "message": "Error de validación en los datos enviados. Revise los campos obligatorios y tipos de datos."
        },
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    path = request.url.path
    method = request.method
    print(f"\n[BACKEND-LOG] ➡️ RECIBIENDO: {method} {path}")
    import sys
    sys.stdout.flush()
    try:
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000
        print(f"[BACKEND-LOG] ✅ COMPLETADO: {method} {path} en {process_time:.2f}ms. Status: {response.status_code}")
        sys.stdout.flush()
        return response
    except Exception as e:
        print(f"[BACKEND-LOG] ❌ ERROR PROCESANDO: {method} {path} -> {str(e)}")
        sys.stdout.flush()
        raise

# --- LAZY ROUTER LOADING ---
# Importamos y registramos cada módulo solo cuando es necesario. 
# Esto acelera el arranque y ayuda a evitar importaciones circulares.

def include_routers(app: FastAPI):
    from app.routes import auth, companies, categories, brands, finance, analytics, inventory, delivery, io, purchasing, purchase_quotes, financial, sales, sales_quotes, sales_config, pricing, marketing, audit, staff, shop, intercompany
    
    routes = [
        auth, companies, categories, brands, finance, analytics, 
        inventory, delivery, io, purchasing, purchase_quotes, 
        financial, sales_quotes, sales, sales_config, pricing, 
        marketing, audit, staff, shop, intercompany
    ]
    
    for route in routes:
        app.include_router(route.router)

include_routers(app)


@app.on_event("startup")
async def start_db():
    print("Backend: Initializing Database...")
    await init_db()
    pass

@app.get("/")
async def root():
    return {"message": "ERP System API is running"}
