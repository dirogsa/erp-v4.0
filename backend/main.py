import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.exceptions.business_exceptions import BusinessException
from app.exceptions.handlers import business_exception_handler
from app.core.config import settings

app = FastAPI(title="ERP System API", version="1.0.0")

app.add_exception_handler(BusinessException, business_exception_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- LAZY ROUTER LOADING ---
# Importamos y registramos cada módulo solo cuando es necesario. 
# Esto acelera el arranque y ayuda a evitar importaciones circulares.

def include_routers(app: FastAPI):
    from app.routes import auth, companies, categories, brands, finance, analytics, inventory, prices, delivery, io, purchasing, purchase_quotes, financial, sales, sales_quotes, sales_config, pricing, marketing, audit, staff, shop
    
    routes = [
        auth, companies, categories, brands, finance, analytics, 
        inventory, prices, delivery, io, purchasing, purchase_quotes, 
        financial, sales_quotes, sales, sales_config, pricing, 
        marketing, audit, staff, shop
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
