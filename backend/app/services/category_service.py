from typing import List, Optional
from app.models.inventory import ProductCategory
from app.exceptions.business_exceptions import DuplicateEntityException, NotFoundException

async def get_categories() -> List[ProductCategory]:
    return await ProductCategory.find_all().to_list()

async def create_category(category_data: ProductCategory) -> ProductCategory:
    existing = await ProductCategory.find_one(ProductCategory.name == category_data.name)
    if existing:
        raise DuplicateEntityException("ProductCategory", "name", category_data.name)
    
    await category_data.insert()
    return category_data

async def update_category(id: str, update_data: ProductCategory) -> ProductCategory:
    category = await ProductCategory.get(id)
    if not category:
        raise NotFoundException("ProductCategory", id)
    
    # Check name uniqueness if changed
    if update_data.name != category.name:
        existing = await ProductCategory.find_one(ProductCategory.name == update_data.name)
        if existing:
            raise DuplicateEntityException("ProductCategory", "name", update_data.name)
            
    category.name = update_data.name
    category.description = update_data.description
    category.attributes_schema = update_data.attributes_schema
    
    await category.save()
    return category

async def delete_category(id: str) -> bool:
    category = await ProductCategory.get(id)
    if not category:
        raise NotFoundException("ProductCategory", id)
    
    # Optional: Check for usage in Products before delete
    
    await category.delete()
    return True
