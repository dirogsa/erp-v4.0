import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def debug_search():
    uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("MONGO_DB_NAME", "erp_db")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    term = "WA6172"
    # Clean term: remove spaces and hyphens
    clean_term = term.replace(" ", "").replace("-", "")
    
    print(f"Buscando '{term}' (limpio: '{clean_term}')...")
    
    # Try different queries
    queries = [
        {"sku": term},
        {"equivalences.code": term},
        {"sku": {"$regex": clean_term, "$options": "i"}},
        {"equivalences.code": {"$regex": clean_term, "$options": "i"}}
    ]
    
    for i, q in enumerate(queries):
        prod = await db.products.find_one(q)
        if prod:
            print(f"Query {i} EXITOSA: {prod['sku']} - {prod['name']}")
            print(f"Visibilidad: is_active_in_shop={prod.get('is_active_in_shop')}, type={prod.get('type')}")
            # Fix it if found
            if not prod.get('is_active_in_shop') or prod.get('type') != 'COMMERCIAL':
                await db.products.update_one({"_id": prod["_id"]}, {"$set": {"is_active_in_shop": True, "type": "COMMERCIAL"}})
                print("✅ PRODUCTO CORREGIDO Y ACTIVADO.")
            return

    print("❌ No se encontró el producto con ninguna variante de búsqueda.")

if __name__ == "__main__":
    asyncio.run(debug_search())
