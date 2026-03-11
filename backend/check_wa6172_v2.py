import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def check_all_products():
    uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("MONGO_DB_NAME", "erp_db")
    print(f"Conectando a {uri} - DB: {db_name}")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    term = "WA6172"
    query = {
        "$or": [
            {"sku": term},
            {"equivalences.code": term},
            {"name": {"$regex": term, "$options": "i"}}
        ]
    }
    
    prod = await db.products.find_one(query)
    
    if prod:
        print(f"✅ PRODUCTO ENCONTRADO")
        print(f"Nombre: {prod.get('name')}")
        print(f"SKU: {prod.get('sku')}")
        print(f"is_active_in_shop: {prod.get('is_active_in_shop')}")
        print(f"type: {prod.get('type')}")
        print(f"equivalences: {prod.get('equivalences')}")
    else:
        # Check all to see if anything partially matches
        partial = await db.products.find_one({"sku": {"$regex": term, "$options": "i"}})
        if partial:
            print(f"⚠️ Encontrado SKU parcial: {partial.get('sku')}")
        else:
            print("❌ No se encontró nada con ese código.")

if __name__ == "__main__":
    asyncio.run(check_all_products())
