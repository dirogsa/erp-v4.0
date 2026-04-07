import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

async def fix_database_visibility():
    uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("MONGO_DB_NAME", "erp_db")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    print("Iniciando revisión masiva de productos...")
    
    # Vamos a buscar TODOS los productos para limpiar sus datos.
    # Así nos aseguramos de que los tipos de datos sean correctos.
    cursor = db.products.find({})
    productos = await cursor.to_list(length=None)
    
    arreglados = 0
    
    for prod in productos:
        needs_update = False
        update_fields = {}
        
        # 1. Corregir tipos de booleanos si se guardaron como strings ("true", "1", true, etc)
        is_active = prod.get("is_active_in_shop")
        if isinstance(is_active, str):
            needs_update = True
            update_fields["is_active_in_shop"] = (is_active.lower() == "true" or is_active == "1")
            
        # 2. Asegurarnos de que el campo "type" esté presente (si está vacío, "COMMERCIAL")
        p_type = prod.get("type")
        if not p_type or str(p_type).strip() == "":
            needs_update = True
            update_fields["type"] = "COMMERCIAL"
            
        if needs_update:
            await db.products.update_one(
                {"_id": prod["_id"]},
                {"$set": update_fields}
            )
            arreglados += 1
            
    print(f"✅ Proceso completado. Se han normalizado y arreglado {arreglados} productos.")

if __name__ == "__main__":
    asyncio.run(fix_database_visibility())
