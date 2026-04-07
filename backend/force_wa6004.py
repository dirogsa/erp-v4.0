
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def force_fix():
    uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("MONGO_DB_NAME", "erp_db")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    term = "WA6004"
    print(f"Buscando '{term}' para forzar visibilidad...")
    
    # Find the product
    query = {
        "$or": [
            {"sku": term},
            {"equivalences.code": term}
        ]
    }
    
    product = await db.products.find_one(query)
    
    if product:
        print(f"Producto encontrado: {product['sku']} - {product['name']}")
        print(f"is_active_in_shop actual: {product.get('is_active_in_shop')}")
        print(f"type actual: {product.get('type')}")
        
        # Force the fix
        result = await db.products.update_one(
            {"_id": product["_id"]},
            {
                "$set": {
                    "is_active_in_shop": True,
                    "type": "COMMERCIAL"
                }
            }
        )
        
        if result.modified_count > 0:
            print("✅ Producto actualizado con éxito: ahora es VISIBLE y COMERCIAL.")
        else:
            print("ℹ️ El producto ya tenía los valores correctos o no se pudo modificar.")
            
        # Re-verify
        updated = await db.products.find_one({"_id": product["_id"]})
        print(f"Estado final: is_active_in_shop={updated.get('is_active_in_shop')}, type={updated.get('type')}")
    else:
        print(f"❌ No se encontró ningún producto con el código {term}.")

if __name__ == "__main__":
    asyncio.run(force_fix())
