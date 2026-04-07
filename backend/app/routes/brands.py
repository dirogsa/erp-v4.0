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
    Escanea todos los productos y extrae marcas Y modelos de vehículos.
    Este proceso es el que alimenta la lista estática para que el Shop sea instantáneo.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Pipeline maestro para agrupar marcas con todos sus modelos únicos
    pipeline = [
        {"$match": {"applications": {"$exists": True, "$not": {"$size": 0}}}},
        {"$unwind": "$applications"},
        {"$group": {
            "_id": {"$toUpper": "$applications.make"},
            "models": {"$addToSet": {"$toUpper": "$applications.model"}}
        }},
        {"$match": {"_id": {"$ne": None, "$regex": ".+"}}},
        {"$sort": {"_id": 1}}
    ]
    
    results = await Product.get_pymongo_collection().aggregate(pipeline).to_list(None)
    
    processed_count = 0
    for res in results:
        make_name = res["_id"].strip().upper()
        # Filtrar modelos inválidos (vacíos o null)
        model_list = sorted([m.strip().upper() for m in res["models"] if m and str(m).strip()])
        
        # Actualizar o Crear marca
        brand = await VehicleBrand.find_one(VehicleBrand.name == make_name)
        if brand:
            brand.models = model_list
            await brand.save()
        else:
            new_brand = VehicleBrand(
                name=make_name,
                origin=BrandOrigin.OTHER,
                models=model_list
            )
            await new_brand.insert()
        processed_count += 1
            
    return {
        "message": f"Sincronización exitosa. {processed_count} marcas actualizadas con sus modelos.",
        "brands_processed": processed_count
    }

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
