import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["erp_system"]
    
    prod = await db.products.find_one({"sku": "LF260"})
    if prod:
        print(f"Product type: {prod.get('type')}, brand: '{prod.get('brand')}', name: '{prod.get('name')}'")
    else:
        print("Product LF260 not found")

    prod2 = await db.products.find_one({"sku": "151000158AA"})
    if prod2:
        print(f"Product type: {prod2.get('type')}, brand: '{prod2.get('brand')}', name: '{prod2.get('name')}'")
        
asyncio.run(test())
