from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import List, Optional
from ..models.inventory import VehicleBrand, Product, BrandOrigin
from ..services.brand_service import ensure_brands_exist, perform_full_brand_sync
from app.routes.auth import get_current_user
from app.models.auth import User, UserRole

router = APIRouter(prefix="/brands", tags=["Brands"])

@router.get("/", response_model=List[VehicleBrand])
async def get_brands(origin: Optional[BrandOrigin] = None):
    query = {}
    if origin:
        query["origin"] = origin
    # Sort alphabetically by name
    return await VehicleBrand.find(query).sort([("name", 1)]).to_list()

@router.post("/sync")
async def sync_brands(background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user)):
    """
    Inicia la extracción asíncrona de marcas y modelos.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")

    background_tasks.add_task(perform_full_brand_sync)
    return {"message": "Sincronización iniciada", "status": "processing"}

@router.get("/sync/status")
async def sync_status(current_user: User = Depends(get_current_user)):
    """
    Retorna el progreso actual de la sincronización.
    """
    from ..services.brand_service import get_sync_status
    return await get_sync_status()

@router.patch("/bulk")
async def bulk_update_brands(
    brand_names: List[str], 
    update_data: dict, 
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Allowed fields for bulk update
    allowed_fields = ["is_active", "is_popular", "origin"]
    filtered_update = {k: v for k, v in update_data.items() if k in allowed_fields}
    
    if not filtered_update:
        return {"message": "No valid fields to update"}

    await VehicleBrand.get_pymongo_collection().update_many(
        {"name": {"$in": brand_names}},
        {"$set": filtered_update}
    )
    return {"message": f"Updated {len(brand_names)} brands"}

@router.put("/{name}")
async def update_brand(name: str, brand_data: VehicleBrand, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    brand = await VehicleBrand.find_one(VehicleBrand.name == name)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
        
    brand.origin = brand_data.origin
    brand.logo_url = brand_data.logo_url
    brand.is_popular = brand_data.is_popular
    brand.is_active = brand_data.is_active
    brand.parent_name = brand_data.parent_name
    await brand.save()
    return brand

@router.delete("/{name}")
async def delete_brand(name: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    brand = await VehicleBrand.find_one(VehicleBrand.name == name)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
        
    await brand.delete()
    return {"message": "Brand deleted"}
