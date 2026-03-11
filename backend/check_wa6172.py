import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def check_product():
    client = AsyncIOMotorClient(os.getenv("MONGODB_URI"))
    db = client[os.getenv("MONGO_DB_NAME", "erp_db")]
    
    # Search by SKU
    sku_match = await db.products.find_one({"sku": "WA6172"})
    # Search by Equivalence
    equiv_match = await db.products.find_one({"equivalences.code": "WA6172"})
    
    print(f"Buscando 'WA6172'...")
    if sku_match:
        print(f"Encontrado por SKU: {sku_match['name']}")
        print(f"Activo en Shop: {sku_match.get('is_active_in_shop')}")
        print(f"Tipo: {sku_match.get('type')}")
    elif equiv_match:
        print(f"Encontrado por Equivalencia en el producto: {equiv_match['name']}")
        print(f"SKU del producto: {equiv_match['sku']}")
        print(f"Activo en Shop: {equiv_match.get('is_active_in_shop')}")
        print(f"Tipo: {equiv_match.get('type')}")
    else:
        print("No se encontró ningún producto con 'WA6172' como SKU o equivalencia.")

if __name__ == "__main__":
    asyncio.run(check_product())
