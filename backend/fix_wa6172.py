import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def fix_product():
    client = AsyncIOMotorClient(os.getenv("MONGODB_URI"))
    db = client[os.getenv("MONGO_DB_NAME", "erp_db")]
    
    term = "WA6172"
    prod = await db.products.find_one({"sku": term})
    if not prod:
        prod = await db.products.find_one({"equivalences.code": term})
        
    if prod:
        print(f"Producto encontrado: {prod['sku']} - {prod['name']}")
        print(f"Estado actual is_active_in_shop: {prod.get('is_active_in_shop')}")
        
        if not prod.get('is_active_in_shop'):
            print("Activando producto para la tienda...")
            await db.products.update_one({"_id": prod["_id"]}, {"$set": {"is_active_in_shop": True, "type": "COMMERCIAL"}})
            print("✅ Producto activado con éxito.")
        else:
            print("El producto ya está activo. El problema podría ser otro.")
    else:
        print(f"❌ No se encontró ningún producto con el código {term} en la base de datos.")

if __name__ == "__main__":
    asyncio.run(fix_product())
