from typing import List, Optional
from app.models.inventory import ProductCategory
from app.exceptions.business_exceptions import DuplicateEntityException, NotFoundException

async def get_categories(company_id: Optional[str] = None) -> List[ProductCategory]:
    # En el Catálogo Maestro Global, las categorías son compartidas por todas las empresas
    return await ProductCategory.find_all().to_list()

async def create_category(category_data: ProductCategory) -> ProductCategory:
    existing = await ProductCategory.find_one(ProductCategory.name == category_data.name)
    if existing:
        raise DuplicateEntityException("ProductCategory", "name", category_data.name)
    # Self-Seeding: The official name is usually the first valid alias
    if not category_data.import_aliases:
        category_data.import_aliases = []
    
    if category_data.name not in category_data.import_aliases:
        category_data.import_aliases.append(category_data.name)
        
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
    category.import_aliases = getattr(update_data, 'import_aliases', [])
    category.attributes_schema = update_data.attributes_schema
    
    await category.save()
    return category

async def delete_category(id: str) -> bool:
    category = await ProductCategory.get(id)
    if not category:
        raise NotFoundException("ProductCategory", id)
    
    await category.delete()
    return True

async def get_orphan_category_names() -> List[dict]:
    """
    World-Class Reconciliation: Finds messy category names in Products 
    and provides context (count and samples) for the UI.
    """
    from app.models.inventory import Product
    
    pipeline = [
        {"$match": {"category_id": None}},
        {"$group": {
            "_id": "$category_name", 
            "count": {"$sum": 1},
            "samples": {"$push": "$name"}
        }},
        {"$match": {"_id": {"$ne": None, "$ne": ""}}},
        {"$project": {
            "_id": 1,
            "count": 1,
            "samples": {"$slice": ["$samples", 3]} # Only show first 3 products as examples
        }},
        {"$sort": {"count": -1}} # Show most critical ones first
    ]
    
    results = await Product.get_motor_collection().aggregate(pipeline).to_list(length=None)
    return results

async def map_orphan_to_canonical(orphan_name: str, canonical_id: str) -> int:
    """
    Merges a messy category into a canonical one:
    1. Updates all products (bulk).
    2. Learns the alias for future imports.
    """
    from app.models.inventory import Product, ProductCategory
    
    category = await ProductCategory.get(canonical_id)
    if not category:
        raise NotFoundException("ProductCategory", canonical_id)
        
    # Atomic bulk update
    update_result = await Product.find(
        Product.category_name == orphan_name, 
        Product.category_id == None
    ).update({"$set": {"category_id": canonical_id}})
    
    # Self-Learning: Add as alias
    if orphan_name not in category.import_aliases:
        category.import_aliases.append(orphan_name)
        await category.save()
        
    return update_result.modified_count
