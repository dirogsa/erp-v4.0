import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['erp_db']  # Assuming 'erp_db' is the database name
    count = await db.vehicle_brands.count_documents({})
    print(f"Total vehicle brands: {count}")
    docs = await db.vehicle_brands.find({}).to_list(10)
    for d in docs:
        print(d)

asyncio.run(main())
