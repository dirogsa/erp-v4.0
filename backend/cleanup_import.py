import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def scrub():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    dbs = await client.list_database_names()
    targets = [db for db in dbs if db not in ['admin', 'config', 'local']]
    
    for db_name in targets:
        db = client[db_name]
        collections = await db.list_collection_names()
        
        if "sales_invoices" in collections:
            await db.sales_invoices.delete_one({"invoice_number": "FV-26-0001"})
            print(f"Borrando FV-26-0001 en {db_name}")
            
        if "sales_orders" in collections:
            await db.sales_orders.delete_one({"order_number": "OV-26-0001"})
            print(f"Borrando OV-26-0001 en {db_name}")
            
        if "delivery_guides" in collections:
            await db.delivery_guides.delete_one({"guide_number": "GV-26-0001"})
            print(f"Borrando GV-26-0001 en {db_name}")

if __name__ == "__main__":
    asyncio.run(scrub())
