from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.models.marketplace import MarketplaceProduct, MarketplaceVendor, MarketplaceCategory
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/marketplace", tags=["Marketplace"])

@router.get("/products", response_model=PaginatedResponse[MarketplaceProduct])
async def get_marketplace_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    brand: Optional[str] = None,
    vendor: Optional[str] = None
):
    query = {"is_active": True}
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"sku": {"$regex": search, "$options": "i"}},
            {"brand": {"$regex": search, "$options": "i"}}
        ]
        
    if brand:
        query["brand"] = {"$regex": f"^{brand}$", "$options": "i"}
        
    if vendor:
        query["vendor_name"] = {"$regex": f"^{vendor}$", "$options": "i"}

    total = await MarketplaceProduct.find(query).count()
    items = await MarketplaceProduct.find(query).sort("-created_at").skip(skip).limit(limit).to_list()
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=skip // limit + 1,
        pages=(total + limit - 1) // limit,
        size=limit
    )

@router.get("/vendors", response_model=PaginatedResponse[MarketplaceVendor])
async def get_marketplace_vendors(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    query = {"is_active": True}
    total = await MarketplaceVendor.find(query).count()
    items = await MarketplaceVendor.find(query).sort("name").skip(skip).limit(limit).to_list()
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=skip // limit + 1,
        pages=(total + limit - 1) // limit,
        size=limit
    )

# --- CATEGORY CRUD ---

@router.get("/categories", response_model=PaginatedResponse[MarketplaceCategory])
async def get_marketplace_categories(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    query = {"is_active": True}
    total = await MarketplaceCategory.find(query).count()
    items = await MarketplaceCategory.find(query).sort("name").skip(skip).limit(limit).to_list()
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=skip // limit + 1,
        pages=(total + limit - 1) // limit,
        size=limit
    )

@router.post("/categories", response_model=MarketplaceCategory)
async def create_marketplace_category(category: MarketplaceCategory):
    import uuid
    # Auto-generar código si no viene
    if not category.code:
        category.code = f"MKT-CAT-{str(uuid.uuid4())[:6].upper()}"
        
    # Resolver nombre del padre si viene parent_id
    if category.parent_id:
        from bson import ObjectId
        parent = await MarketplaceCategory.get(ObjectId(category.parent_id))
        if parent:
            category.parent_name = parent.name
            
    return await category.insert()

@router.put("/categories/{category_id}", response_model=MarketplaceCategory)
async def update_marketplace_category(category_id: str, data: dict):
    from bson import ObjectId
    category = await MarketplaceCategory.get(ObjectId(category_id))
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    for key, value in data.items():
        if hasattr(category, key):
            setattr(category, key, value)
            
    # Resolver nombre del padre si viene parent_id
    if "parent_id" in data and data["parent_id"]:
        parent = await MarketplaceCategory.get(ObjectId(data["parent_id"]))
        if parent:
            category.parent_name = parent.name
    elif "parent_id" in data and not data["parent_id"]:
        category.parent_name = None
            
    await category.save()
    return category

@router.delete("/categories/{category_id}")
async def delete_marketplace_category(category_id: str):
    from bson import ObjectId
    category = await MarketplaceCategory.get(ObjectId(category_id))
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Soft Delete (Archivado Lógico)
    category.is_active = False
    await category.save()
    return {"status": "archived"}

# --- VENDOR CRUD ---

@router.post("/vendors", response_model=MarketplaceVendor)
async def create_marketplace_vendor(vendor: MarketplaceVendor):
    return await vendor.insert()

@router.put("/vendors/{vendor_id}", response_model=MarketplaceVendor)
async def update_marketplace_vendor(vendor_id: str, data: dict):
    from bson import ObjectId
    vendor = await MarketplaceVendor.get(ObjectId(vendor_id))
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    for key, value in data.items():
        if hasattr(vendor, key):
            setattr(vendor, key, value)
            
    await vendor.save()
    return vendor

@router.delete("/vendors/{vendor_id}")
async def delete_marketplace_vendor(vendor_id: str):
    from bson import ObjectId
    vendor = await MarketplaceVendor.get(ObjectId(vendor_id))
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    await vendor.delete()
    return {"status": "deleted"}

# --- PRODUCT CRUD ---

@router.post("/products", response_model=MarketplaceProduct)
async def create_marketplace_product(product: MarketplaceProduct):
    # Ensure vendor exists and grab its name
    if product.vendor_id:
        from bson import ObjectId
        vendor = await MarketplaceVendor.get(ObjectId(product.vendor_id))
        if vendor:
            product.vendor_name = vendor.name
            
    # Ensure category exists and grab its name
    if product.category_id:
        from bson import ObjectId
        category = await MarketplaceCategory.get(ObjectId(product.category_id))
        if category:
            product.category_name = category.name
            
    return await product.insert()

@router.put("/products/{product_id}", response_model=MarketplaceProduct)
async def update_marketplace_product(product_id: str, data: dict):
    from bson import ObjectId
    product = await MarketplaceProduct.get(ObjectId(product_id))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    for key, value in data.items():
        if hasattr(product, key):
            setattr(product, key, value)
            
    if "vendor_id" in data and data["vendor_id"]:
        vendor = await MarketplaceVendor.get(ObjectId(data["vendor_id"]))
        if vendor:
            product.vendor_name = vendor.name
            
    if "category_id" in data and data["category_id"]:
        category = await MarketplaceCategory.get(ObjectId(data["category_id"]))
        if category:
            product.category_name = category.name
            
    await product.save()
    return product

@router.delete("/products/{product_id}")
async def delete_marketplace_product(product_id: str):
    from bson import ObjectId
    product = await MarketplaceProduct.get(ObjectId(product_id))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    await product.delete()
    return {"status": "deleted"}

