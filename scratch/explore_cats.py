import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['erp_db']
    cats = await db['product_categories'].find().to_list(100)
    for c in cats:
        print(f"ID: {c['_id']}, Name: {c.get('name')}, Parent: {c.get('parent_id')}")

if __name__ == '__main__':
    asyncio.run(main())
