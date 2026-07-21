import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def update_wix_brand():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['erp_db']
    
    result = await db.product_brands.update_one(
        { "name": "WIX" },
        {
            "$set": {
                "logo_public_id": "ERP/brands/wix-logo",
                "banner_public_id": "ERP/brands/wix-banner",
            }
        }
    )
    print(f"Actualizado a estructura ERP/: {result.modified_count}")

asyncio.run(update_wix_brand())
