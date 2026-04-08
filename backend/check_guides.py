import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.inventory import DeliveryGuide, Product, StockMovement, GuideHistory
from app.models.sales import SalesInvoice, SalesOrder, Customer, CustomerBranch

async def check():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    # I don't know the exact database name, I'll iterate through all databases
    # and find the one that has delivery_guides collection
    dbs = await client.list_database_names()
    targets = [db for db in dbs if db not in ['admin', 'config', 'local']]
    
    for db_name in targets:
        print(f"Checking DB: {db_name}")
        db = client[db_name]
        collections = await db.list_collection_names()
        if "delivery_guides" in collections:
            count = await db.delivery_guides.count_documents({})
            print(f"Found {count} guides in {db_name}")
            cursor = db.delivery_guides.find()
            async for doc in cursor:
                print(doc.get("guide_number"), doc.get("status"))

if __name__ == "__main__":
    asyncio.run(check())
