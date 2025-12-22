from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from ..models.inventory import VehicleBrand, Product, BrandOrigin
from ..services.brand_service import ensure_brands_exist
from app.routes.auth import get_current_user
from app.models.auth import User, UserRole

router = APIRouter(prefix="/brands", tags=["Brands"])

@router.get("/", response_model=List[VehicleBrand])
async def get_brands(origin: Optional[BrandOrigin] = None):
    query = {}
    if origin:
        query["origin"] = origin
    return await VehicleBrand.find(query).to_list()

@router.post("/sync")
async def sync_brands(current_user: User = Depends(get_current_user)):
    """
    Escanea todos los productos y extrae marcas de vehículos de las aplicaciones.
    Crea nuevas marcas en estado 'OTHER' si no existen.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Obtener todas las marcas únicas de las aplicaciones de los productos de forma segura
    pipeline = [
        {"$match": {"applications": {"$exists": True, "$not": {"$size": 0}}}},
        {"$unwind": "$applications"},
        {"$group": {"_id": "$applications.make"}},
        {"$match": {"_id": {"$ne": None, "$regex": ".+"}}}
    ]
    
    results = await Product.aggregate(pipeline).to_list()
    makes = [r["_id"] for r in results]
    
    await ensure_brands_exist(makes)
            
    return {"message": f"Sync completed. {len(makes)} brands processed.", "makes": makes}

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
