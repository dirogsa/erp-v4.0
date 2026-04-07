
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def check_product():
    uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("DB_NAME", "erp_db")
    print(f"Buscando 'WA6004' en {db_name}...")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    # Search by SKU
    sku_match = await db.products.find_one({"sku": "WA6004"})
    # Search by Equivalence
    equiv_match = await db.products.find_one({"equivalences.code": "WA6004"})
    
    if sku_match:
        print(f"Encontrado por SKU: {sku_match.get('name')}")
        print(f"Activo en Shop: {sku_match.get('is_active_in_shop')}")
        print(f"Tipo: {sku_match.get('type')}")
        print(f"Status: {sku_match.get('status')}")
    elif equiv_match:
        print(f"Encontrado por Equivalencia en el producto: {equiv_match.get('name')}")
        print(f"SKU del producto: {equiv_match.get('sku')}")
        print(f"Activo en Shop: {equiv_match.get('is_active_in_shop')}")
        print(f"Tipo: {equiv_match.get('type')}")
        print(f"Status: {equiv_match.get('status')}")
    else:
        print("No se encontró ningún producto con 'WA6004' como SKU o equivalencia.")
        # Let's try partial search just in case
        partial = await db.products.find_one({"sku": {"$regex": "WA6004", "$options": "i"}})
        if partial:
            print(f"Encontrado por regex SKU: {partial.get('sku')} - {partial.get('name')}")
        else:
             equiv_partial = await db.products.find_one({"equivalences.code": {"$regex": "WA6004", "$options": "i"}})
             if equiv_partial:
                 print(f"Encontrado por regex Equiv: {equiv_partial.get('sku')} - {equiv_partial.get('name')}")

if __name__ == "__main__":
    asyncio.run(check_product())
