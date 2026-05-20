import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.sales import SalesInvoice
from app.models.inventory import Product
from beanie import init_beanie

async def test():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    await init_beanie(database=client["erp_system"], document_models=[SalesInvoice, Product])
    inv = await SalesInvoice.find_one({"sunat_number": "E001-734"})
    if inv:
        for i, item in enumerate(inv.items):
            print(f"Item {i}: sku={item.product_sku}, brand={item.brand}, is_unmapped={getattr(item, 'is_unmapped', None)}")
    else:
        print("Not found")
        
asyncio.run(test())
