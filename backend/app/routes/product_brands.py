from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import List, Optional
from ..models.inventory import ProductBrand, Product
from app.routes.auth import get_current_user
from app.models.auth import User, UserRole

router = APIRouter(prefix="/product-brands", tags=["Product Brands"])

async def perform_full_product_brand_sync():
    """Extracts unique aftermarket brands from product equivalences and upserts them into ProductBrand collection."""
    # Get distinct brands from equivalences where is_original is False
    unique_brands = await Product.distinct("equivalences.brand", {"equivalences.is_original": False})
    
    for brand_name in unique_brands:
        if not brand_name:
            continue
        brand_name = brand_name.strip()
        existing = await ProductBrand.find_one(ProductBrand.name == brand_name)
        if not existing:
            new_brand = ProductBrand(name=brand_name)
            await new_brand.save()

@router.get("/", response_model=List[ProductBrand])
async def get_product_brands():
    return await ProductBrand.find({}).sort([("name", 1)]).to_list()

@router.post("/sync")
async def sync_product_brands(background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")

    background_tasks.add_task(perform_full_product_brand_sync)
    return {"message": "Sincronización iniciada", "status": "processing"}

@router.patch("/bulk")
async def bulk_update_product_brands(
    brand_names: List[str], 
    update_data: dict, 
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    allowed_fields = ["is_active", "show_in_catalog"]
    filtered_update = {k: v for k, v in update_data.items() if k in allowed_fields}
    
    if not filtered_update:
        return {"message": "No valid fields to update"}

    await ProductBrand.get_motor_collection().update_many(
        {"name": {"$in": brand_names}},
        {"$set": filtered_update}
    )
    return {"message": f"Updated {len(brand_names)} brands"}

@router.put("/{name:path}")
async def update_product_brand(name: str, brand_data: ProductBrand, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    brand = await ProductBrand.find_one(ProductBrand.name == name)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
        
    brand.is_active = brand_data.is_active
    if hasattr(brand_data, 'show_in_catalog'):
        brand.show_in_catalog = brand_data.show_in_catalog
    await brand.save()
    return brand
