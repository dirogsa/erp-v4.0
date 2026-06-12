from fastapi import APIRouter
from typing import List
from pydantic import BaseModel
from app.models.inventory import Product, ProductBrand, VehicleBrand, ProductCategory
from beanie.operators import In, And

router = APIRouter(prefix="/katalog", tags=["Katalog Premium"])

class KatalogGenerateRequest(BaseModel):
    brands: List[str] = []
    categories: List[str] = []  # category_ids
    vehicle_makes: List[str] = [] # filter by vehicle make
    skus: List[str] = []        # Si se provee, es el universo de datos. Ignora brands/categories/vehicle_makes.

class SkuValidationRequest(BaseModel):
    skus: List[str]

@router.get("/brands")
async def get_katalog_brands():
    """Returns active brands from Master Brands for the Katalog config panel"""
    brands = await ProductBrand.find(ProductBrand.show_in_catalog == True).sort(+ProductBrand.name).to_list()
    # We just need the names to display and filter
    return [b.name for b in brands]

@router.get("/vehicle-brands")
async def get_katalog_vehicle_brands():
    """Returns active vehicle makes for the Katalog config panel"""
    brands = await VehicleBrand.find(VehicleBrand.show_in_catalog != False).sort(+VehicleBrand.name).to_list()
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
        # --- Modo filtros (Marca + Categoría o Vehículo) ---
        if not req.brands and not req.vehicle_makes:
            return []
        
        query_conditions = []
        
        if req.brands:
            query_conditions.append(In(Product.brand, req.brands))
            
        if req.categories:
            query_conditions.append(In(Product.category_id, req.categories))
            
        if req.vehicle_makes:
            requested_makes = [m.strip().upper() for m in req.vehicle_makes if m.strip()]
            if requested_makes:
                # Filtrado nativo de MongoDB en el array de objetos applications
                query_conditions.append({"applications.make": {"$in": requested_makes}})

        if query_conditions:
            if len(query_conditions) > 1:
                query = And(*query_conditions)
            else:
                query = query_conditions[0]
            products = await Product.find(query).to_list()
        else:
            products = []

    # Filtrar aplicaciones de marcas de vehículos inactivas (aplica a ambos modos)
    inactive_vehicle_brands = await VehicleBrand.find(VehicleBrand.show_in_catalog == False).to_list()
    inactive_makes = {vb.name.upper() for vb in inactive_vehicle_brands}

    for p in products:
        if p.applications:
            p.applications = [app for app in p.applications if app.make.upper() not in inactive_makes]

    return products
