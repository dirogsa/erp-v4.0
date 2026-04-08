import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_mongo():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    dbs = await client.list_database_names()
    targets = [db for db in dbs if db not in ['admin', 'config', 'local']]
    
    for db_name in targets:
        db = client[db_name]
        collections = await db.list_collection_names()
        if "delivery_guides" in collections:
            count = await db.delivery_guides.count_documents({})
            print(f"Total guides in {db_name}.delivery_guides: {count}")
            cursor = db.delivery_guides.find()
            async for doc in cursor:
                print(f"Guide: {doc.get('guide_number')} | Status: {doc.get('status')} | Inv: {doc.get('invoice_number')}")

if __name__ == "__main__":
    asyncio.run(check_mongo())
