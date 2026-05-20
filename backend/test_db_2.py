import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["erp_system"]
    
    prod = await db.products.find_one({"sku": "LF260"})
    if prod:
        print(f"Product type: {prod.get('type')}, brand: {prod.get('brand')}")
    else:
        print("Product LF260 not found")
        
    inv = await db.sales_invoices.find_one({"sunat_number": "E001-734"})
    if inv:
        for i, item in enumerate(inv.get('items', [])):
            print(f"Item {i}: sku={item.get('product_sku')}, brand={item.get('brand')}, is_unmapped={item.get('is_unmapped')}")

asyncio.run(test())
