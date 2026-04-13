from typing import List
from ..models.inventory import VehicleBrand, BrandOrigin

async def ensure_brands_exist(makes: List[str]):
    if not makes:
        return
    
    # Deduplicate and normalize
    unique_makes = {m.strip().upper() for m in makes if m and m.strip()}
    if not unique_makes:
        return

    # Bulk find existing brands
    existing_brands = await VehicleBrand.find({"name": {"$in": list(unique_makes)}}).to_list()
    existing_names = {b.name for b in existing_brands}
    
    # Create missing ones
    to_create = unique_makes - existing_names
    for make_name in to_create:
        new_brand = VehicleBrand(
            name=make_name, 
            origin=BrandOrigin.OTHER,
            is_popular=False
        )
        await new_brand.create()
        print(f"[AUTO-BRAND] Nueva marca detectada y registrada: {make_name}")
