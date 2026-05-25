import os
import time
import logging
from fastapi import FastAPI, Request, status, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.database import init_db
from app.exceptions.business_exceptions import BusinessException
from app.exceptions.handlers import business_exception_handler
from app.core.config import settings

app = FastAPI(title="Dirogsa Cloud ERP API", version="4.0.0")

# --- LOGGING CONFIGURATION ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn.error")

# --- EXCEPTION HANDLERS ---
app.add_exception_handler(BusinessException, business_exception_handler)

from fastapi.encoders import jsonable_encoder

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=jsonable_encoder({
            "detail": exc.errors(),
            "message": "Error de validación en los datos. Por favor revise los campos."
        }),
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"FATAL ERROR: {request.method} {request.url.path} - {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "message": "Ha ocurrido un error inesperado en el servidor."}
    )

# --- MIDDLEWARES ---
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# --- CORS CONFIGURATION ---
# Base origins for local development
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
]

# Dynamic origins from infrastructure (Render)
if settings.ALLOWED_ORIGINS:
    # Handle both comma-separated strings and extra whitespace
    render_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
    origins.extend(render_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ROUTER REGISTRATION ---
def get_python_process_count():
    try:
        import subprocess
        import os
        if os.name == 'nt': # Windows
            output = subprocess.check_output('tasklist /FI "IMAGENAME eq python.exe" /NH', shell=True).decode(errors='ignore')
            return output.count("python.exe")
        else: # Linux/Render
            output = subprocess.check_output('pgrep -c python', shell=True).decode(errors='ignore')
            return int(output.strip())
    except:
        return 0

def include_routers(app: FastAPI):
    from app.routes import (
        auth, companies, categories, brands, finance, analytics, 
        inventory, delivery, io, purchasing, purchase_quotes, 
        financial, sales, sales_quotes, pricing, 
        marketing, audit, staff, shop, intercompany, config, intelligence
    )
    
    modules = [
        auth, companies, categories, brands, finance, analytics, 
        inventory, delivery, io, purchasing, purchase_quotes, 
        financial, sales_quotes, sales, pricing, 
        marketing, audit, staff, shop, intercompany, config, intelligence
    ]
    
    for module in modules:
        app.include_router(module.router)

include_routers(app)

# --- LIFECYCLE & HEALTH ---
@app.get("/health-check")
async def health_check():
    return {"status": "operational", "version": "4.0.0", "timestamp": time.time()}

@app.get("/system/version")
async def system_version():
    """
    World-Class CI/CD Versioning.
    Reads the version from version.txt (generated during build) or falls back to git describe.
    """
    import subprocess
    import os
    
    version = "dev-local"
    version_file = os.path.join(os.path.dirname(__file__), "..", "version.txt")
    
    if os.path.exists(version_file):
        with open(version_file, "r") as f:
            raw_version = f.read().strip()
            # Si el string es v3.3.7-5-g1234, nos quedamos solo con v3.3.7
            version = raw_version.split("-")[0]
    else:
        try:
            # Fallback for local development
            output = subprocess.check_output(["git", "describe", "--tags", "--always"], stderr=subprocess.DEVNULL)
            raw_version = output.decode().strip()
            version = raw_version.split("-")[0]
        except Exception:
            pass

    return {"version": version}

@app.on_event("startup")
async def startup_event():
    from app.core.bootstrap import bootstrap_system
    
    # Zombie Process Detection
    count = get_python_process_count()
    msg = f"INSTANCE STARTUP | Active Python Processes: {count}"
    if count > 3:
        msg += " WARNING: Multiple processes detected! You might have ZOMBIES."
    
    print("\n" + "="*len(msg))
    print(msg)
    print("="*len(msg) + "\n", flush=True)
    
    logger.info("Initializing ERP Infrastructure...")
    await init_db()
    logger.info("Running System Bootstrap...")
    await bootstrap_system()

@app.get("/sitemap.xml")
async def sitemap():
    """
    Dynamically generates the sitemap.xml listing all active products in the shop.
    Optimized with Beanie projection to only fetch SKUs, preventing memory leaks and timeouts on free tiers.
    """
    from pydantic import BaseModel
    
    class ProductSitemapProjection(BaseModel):
        sku: str

    try:
        from app.models.inventory import Product
        # Highly optimized projection query: only returns SKU, ignoring heavy fields like applications and specs
        products = await Product.find(Product.is_active_in_shop == True).project(ProductSitemapProjection).to_list()
    except Exception as e:
        logger.error(f"Error generating sitemap: {e}")
        products = []
    
    xml_items = []
    # Home Page
    xml_items.append("""  <url>
    <loc>https://dirogsa.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>""")
    # Catalog Page
    xml_items.append("""  <url>
    <loc>https://dirogsa.com/catalog</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>""")
    # B2B Page
    xml_items.append("""  <url>
    <loc>https://dirogsa.com/b2b</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>""")
  
    # Dynamic Products
    for p in products:
        # Avoid malformed XML by cleaning up SKU
        sku_clean = str(p.sku).strip()
        xml_items.append(f"""  <url>
    <loc>https://dirogsa.com/product/{sku_clean}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>""")
        
    xml_body = "\n".join(xml_items)
    xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{xml_body}
</urlset>"""
    return Response(content=xml_content, media_type="application/xml")

@app.get("/robots.txt")
async def robots():
    """
    Serves a dynamically mapped robots.txt.
    """
    content = """User-agent: *
Allow: /

Sitemap: https://dirogsa.com/sitemap.xml
"""
    return Response(content=content, media_type="text/plain")

@app.get("/")
async def root():
    return {"message": "Dirogsa Cloud ERP API v4.0.0"}
