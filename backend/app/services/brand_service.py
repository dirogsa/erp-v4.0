from typing import List
from ..models.inventory import VehicleBrand, BrandOrigin

async def ensure_brands_exist(makes: List[str]):
    """
    Asegura que una lista de marcas existan en la base de datos.
    Se usa automáticamente al guardar productos.
    """
    for make in makes:
        if not make: continue
        make_name = make.strip().upper()
        
        # Evitar duplicados
        exists = await VehicleBrand.find_one(VehicleBrand.name == make_name)
        if not exists:
            new_brand = VehicleBrand(
                name=make_name, 
                origin=BrandOrigin.OTHER,
                is_popular=False
            )
            await new_brand.create()
            print(f"[AUTO-BRAND] Nueva marca detectada y registrada: {make_name}")
