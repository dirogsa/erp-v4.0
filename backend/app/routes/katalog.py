from fastapi import APIRouter
from typing import List
from pydantic import BaseModel
from app.models.inventory import Product, ProductBrand, VehicleBrand, ProductCategory
from beanie.operators import In, And

router = APIRouter(prefix="/katalog", tags=["Katalog Premium"])

class KatalogGenerateRequest(BaseModel):
    brands: List[str] = []
    categories: List[str] = []  # category_ids
    skus: List[str] = []        # Si se provee, es el universo de datos. Ignora brands/categories.

class SkuValidationRequest(BaseModel):
    skus: List[str]

@router.get("/brands")
async def get_katalog_brands():
    """Returns active brands from Master Brands for the Katalog config panel"""
    brands = await ProductBrand.find(ProductBrand.is_active == True).sort(+ProductBrand.name).to_list()
    # We just need the names to display and filter
    return [b.name for b in brands]

@router.get("/categories")
async def get_katalog_categories():
    """Returns all product categories for the Katalog config panel"""
    categories = await ProductCategory.find().sort(+ProductCategory.name).to_list()
    return [{"id": str(c.id), "name": c.name, "description": c.description, "parent_id": c.parent_id} for c in categories]

@router.post("/validate-skus")
async def validate_skus(req: SkuValidationRequest):
    """Audits a list of SKUs against the database. Returns found and not_found."""
    if not req.skus:
        return {"total_submitted": 0, "found": [], "not_found": []}

    # Normalizar: trim y uppercase para comparación robusta
    submitted = [s.strip().upper() for s in req.skus if s.strip()]
    unique_submitted = list(dict.fromkeys(submitted))  # deduplica manteniendo orden

    # Una sola query a MongoDB con $in
    products = await Product.find(In(Product.sku, unique_submitted)).to_list()

    found_skus = {p.sku.upper() for p in products}
    not_found = [s for s in unique_submitted if s not in found_skus]

    found_summary = [{"sku": p.sku, "name": p.name, "brand": p.brand} for p in products]

    return {
        "total_submitted": len(unique_submitted),
        "found": found_summary,
        "not_found": not_found
    }

@router.post("/generate")
async def generate_katalog(req: KatalogGenerateRequest):
    """Returns products ready for A4 render.
    
    Data source priority:
    - If `skus` provided: fetches exactly those SKUs. brands/categories ignored.
    - Otherwise: filters by selected brands and optional categories.
    """
    # --- Modo SKU directo ---
    if req.skus:
        normalized_skus = [s.strip().upper() for s in req.skus if s.strip()]
        products = await Product.find(In(Product.sku, normalized_skus)).to_list()
    else:
        # --- Modo filtros (Marca + Categoría) ---
        if not req.brands:
            return []
        query = In(Product.brand, req.brands)
        if req.categories:
            query = And(query, In(Product.category_id, req.categories))
        products = await Product.find(query).to_list()

    # Filtrar aplicaciones de marcas de vehículos inactivas (aplica a ambos modos)
    inactive_vehicle_brands = await VehicleBrand.find(VehicleBrand.is_active == False).to_list()
    inactive_makes = {vb.name.upper() for vb in inactive_vehicle_brands}

    for p in products:
        if p.applications:
            p.applications = [app for app in p.applications if app.make.upper() not in inactive_makes]

    return products
