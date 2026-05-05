import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['dirogsa-erp'] # Corpus name was dirogsa/erp-v4.0
    
    # Try to find common DB names
    db_names = await client.list_database_names()
    print(f"Databases: {db_names}")
    
    # Use the one that looks correct
    target_db = 'dirogsa-erp' if 'dirogsa-erp' in db_names else ('erp-v4' if 'erp-v4' in db_names else db_names[0])
    db = client[target_db]
    
    print(f"Checking SKUs with 'F' in database: {target_db}")
    products = await db.products.find({"sku": {"$regex": "F"}}).limit(10).to_list(10)
    for p in products:
        print(f"SKU: {p.get('sku')} | Brand: {p.get('brand')}")
    
    await client.close()

if __name__ == "__main__":
    asyncio.run(main())
