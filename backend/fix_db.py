import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def fix_database():
    # Conexión manual a MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["erp_db"] # Asumiendo el nombre por defecto
    collection = db["products"]
    
    print("Iniciando reparación de base de datos...")
    
    # Buscar productos con points_cost no enteros o strings
    cursor = collection.find({"points_cost": {"$exists": True}})
    fixed_count = 0
    total_checked = 0
    
    async for doc in cursor:
        total_checked += 1
        val = doc.get("points_cost")
        
        needs_fix = False
        new_val = 0
        
        if isinstance(val, str):
            try:
                # Intentar convertir a float primero y luego a int
                new_val = int(float(val))
                needs_fix = True
            except:
                new_val = 0
                needs_fix = True
        elif isinstance(val, float):
            new_val = int(val)
            needs_fix = True
            
        if needs_fix:
            await collection.update_one({"_id": doc["_id"]}, {"$set": {"points_cost": new_val}})
            fixed_count += 1
            print(f"Reparado SKU {doc.get('sku')}: {val} -> {new_val}")

    print(f"Reparación completada. Revisados: {total_checked}, Reparados: {fixed_count}")

if __name__ == "__main__":
    asyncio.run(fix_database())
