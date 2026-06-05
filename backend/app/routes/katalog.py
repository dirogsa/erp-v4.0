from fastapi import APIRouter
from typing import List
from pydantic import BaseModel
from app.models.inventory import Product, ProductBrand, VehicleBrand, ProductCategory
from beanie.operators import In, And

router = APIRouter(prefix="/katalog", tags=["Katalog Premium"])

class KatalogGenerateRequest(BaseModel):
    brands: List[str]
    categories: List[str] = [] # category_ids

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

@router.post("/generate")
async def generate_katalog(req: KatalogGenerateRequest):
    """Returns products filtered by selected brands and categories, ready for A4 render"""
    if not req.brands:
        return []
    
    # Construimos la consulta base
    query = In(Product.brand, req.brands)
    
    # Si se especificaron categorías, filtramos también por ellas (category_id)
    if req.categories:
        query = And(query, In(Product.category_id, req.categories))
        
    products = await Product.find(query).to_list()
    
    # Filter applications to exclude inactive vehicle brands
    inactive_vehicle_brands = await VehicleBrand.find(VehicleBrand.is_active == False).to_list()
    inactive_makes = {vb.name.upper() for vb in inactive_vehicle_brands}
    
    for p in products:
        if p.applications:
            p.applications = [app for app in p.applications if app.make.upper() not in inactive_makes]

    return products
