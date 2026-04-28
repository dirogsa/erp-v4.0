import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie, Document
from typing import List, Optional

class ProductBrand(Document):
    name: str
    aliases: List[str] = []
    is_active: bool = True

    class Settings:
        name = "product_brands"

async def verify_and_seed():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    await init_beanie(database=client["erp_v4"], document_models=[ProductBrand])
    
    brands_to_ensure = [
        {"name": "FILTRON", "aliases": ["FILTRON"]},
        {"name": "WIX", "aliases": ["WIX", "WIX FILTERS"]},
        {"name": "AZUMI", "aliases": ["AZUMI"]},
        {"name": "MANN", "aliases": ["MANN", "MANN-FILTER", "MANN+HUMMEL"]},
    ]
    
    for b_data in brands_to_ensure:
        exists = await ProductBrand.find_one(ProductBrand.name == b_data["name"])
        if not exists:
            await ProductBrand(**b_data).insert()
            print(f"✅ Marca '{b_data['name']}' creada en el Maestro.")
        else:
            # Asegurar que tenga los alias correctos
            exists.aliases = list(set(exists.aliases + b_data["aliases"]))
            await exists.save()
            print(f"🔹 Marca '{b_data['name']}' ya existía, alias actualizados.")

if __name__ == "__main__":
    asyncio.run(verify_and_seed())
