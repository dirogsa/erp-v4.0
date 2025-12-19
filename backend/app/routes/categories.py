from fastapi import APIRouter
from typing import List
from app.models.inventory import ProductCategory
from app.services import category_service

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
