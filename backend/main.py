import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db

from app.routes import inventory, purchasing, sales, sales_quotes, purchase_quotes, financial, analytics, prices, delivery, companies, categories, io, auth, shop, brands, pricing, marketing, audit, sales_config


from app.exceptions.business_exceptions import BusinessException
from app.exceptions.handlers import business_exception_handler
from app.core.config import settings

app = FastAPI(title="ERP System API", version="1.0.0")

app.add_exception_handler(BusinessException, business_exception_handler)

# Configuración de CORS - Permite localhost y URLs en producción
origins = [
    "http://localhost:5173",  # Frontend ERP
    "http://localhost:5174",  # Frontend Shop
    "http://localhost:3000",
]

# Agregar URLs de producción desde configuraciones
if settings.ALLOWED_ORIGINS:
    origins.extend([o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(inventory.router)
app.include_router(categories.router)
app.include_router(purchase_quotes.router) # Specific routes first
app.include_router(purchasing.router)
app.include_router(sales_quotes.router) # Specific routes first
app.include_router(sales.router)
app.include_router(financial.router)
app.include_router(analytics.router)
app.include_router(prices.router)
app.include_router(delivery.router)
app.include_router(companies.router)
app.include_router(io.router)
app.include_router(auth.router)
app.include_router(shop.router)
app.include_router(brands.router)
app.include_router(pricing.router)
app.include_router(marketing.router)
app.include_router(audit.router)
app.include_router(sales_config.router)


@app.on_event("startup")
async def start_db():
    print("Backend: Initializing Database...")
    await init_db()
    print("Backend: Database initialized successfully")
    
    # Automatic warehouse creation removed to allow manual management
    pass

@app.get("/")
async def root():
    return {"message": "ERP System API is running"}
