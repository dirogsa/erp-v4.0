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

# Middleware de diagnóstico rápido
@app.middleware("http")
async def diagnostic_middleware(request: Request, call_next):
    print(f"\n[DEBUG] >> Entrando petición: {request.method} {request.url.path}")
    response = await call_next(request)
    print(f"[DEBUG] << Saliendo respuesta: {request.method} {request.url.path} Status: {response.status_code}")
    return response

# --- CORS: Arquitectura Escalable Enterprise ---
# 1. Recuperar orígenes de variables de entorno (Render Dashboard)
raw_origins = settings.ALLOWED_ORIGINS.split(",") if settings.ALLOWED_ORIGINS else []
origins = [o.strip() for o in raw_origins if o.strip()]

# 2. Configuración de Middleware con Soporte para Subdominios Dinámicos
# Permitimos cualquier subdominio de .onrender.com para máxima escalabilidad en Render
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_origin_regex=r"https://.*\.onrender\.com", # Permite erp-mobile, erp-admin, etc.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print(f"[DEBUG] CORS Initialized. Explicit: {origins} | Wildcard: *.onrender.com")

# --- LAZY ROUTER LOADING ---
# Importamos y registramos cada módulo solo cuando es necesario. 
# Esto acelera el arranque y ayuda a evitar importaciones circulares.

def include_routers(app: FastAPI):
    from app.routes import auth, companies, categories, brands, finance, analytics, inventory, delivery, io, purchasing, purchase_quotes, financial, sales, sales_quotes, sales_config, pricing, marketing, audit, staff, shop, intercompany, config
    
    routes = [
        auth, companies, categories, brands, finance, analytics, 
        inventory, delivery, io, purchasing, purchase_quotes, 
        financial, sales_quotes, sales, sales_config, pricing, 
        marketing, audit, staff, shop, intercompany, config
    ]
    
    for route in routes:
        app.include_router(route.router)

include_routers(app)


@app.on_event("startup")
async def start_db():
    from app.core.bootstrap import bootstrap_system
    print("Backend: Initializing Infrastructure...")
    await init_db()
    print("Backend: Running System Bootstrap...")
    await bootstrap_system()

@app.get("/")
async def root():
    return {"message": "ERP System API is running"}
