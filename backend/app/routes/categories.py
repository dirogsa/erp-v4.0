from fastapi import APIRouter
from typing import List
from app.models.inventory import ProductCategory
from app.services import category_service
from fastapi import Depends
from app.dependencies.company import get_current_company_id

router = APIRouter(prefix="/categories", tags=["Product Categories"])

@router.get("", response_model=List[ProductCategory])
async def get_categories():
    return await category_service.get_categories()

@router.post("", response_model=ProductCategory)
async def create_category(category: ProductCategory):
    return await category_service.create_category(category)

@router.put("/{id}", response_model=ProductCategory)
async def update_category(id: str, category: ProductCategory):
    return await category_service.update_category(id, category)

@router.delete("/{id}")
async def delete_category(id: str):
    await category_service.delete_category(id)
    return {"message": "Category deleted successfully"}

@router.get("/orphans", response_model=List[dict])
async def get_orphans():
    """Discover unmapped category names from imported products (enriched with counts)"""
    return await category_service.get_orphan_category_names()

@router.post("/map-orphan")
async def map_orphan(orphan_name: str, canonical_id: str):
    """Binds an orphan name to a canonical category and updates products"""
    count = await category_service.map_orphan_to_canonical(orphan_name, canonical_id)
    return {"message": f"Successfully mapped {count} products to category.", "count": count}
