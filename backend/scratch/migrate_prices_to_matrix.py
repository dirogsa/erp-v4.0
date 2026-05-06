import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import os
import sys

# Add project root to path
sys.path.append(os.getcwd())

from backend.app.models.pricing import PriceList, PriceEntry
from backend.app.models.inventory import Product
from backend.app.core.config import settings

async def migrate_prices():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGO_DB_NAME]
    await init_beanie(database=db, document_models=[PriceList, PriceEntry, Product])
    
    # 1. Ensure Master Price List exists
    master_list = await PriceList.find_one(PriceList.is_master == True)
    if not master_list:
        print("[MIGRATION] Creating Master Price List...")
        master_list = PriceList(
            name="General",
            description="Lista de Precios Base (Maestra)",
            is_master=True,
            is_active=True,
            color="#3b82f6"
        )
        await master_list.insert()
    
    print(f"[MIGRATION] Using Master List: {master_list.name} ({master_list.id})")
    
    # 2. Find products with price_list > 0
    products = await Product.find(Product.price_list > 0).to_list()
    print(f"[MIGRATION] Found {len(products)} products to migrate.")
    
    migrated_count = 0
    for p in products:
        # Check if entry already exists
        existing = await PriceEntry.find_one(
            PriceEntry.product_id == p.id,
            PriceEntry.price_list_id == master_list.id
        )
        
        if not existing:
            entry = PriceEntry(
                product_id=p.id,
                sku=p.sku,
                price_list_id=master_list.id,
                price=p.price_list,
                currency="PEN"
            )
            await entry.insert()
            migrated_count += 1
            if migrated_count % 100 == 0:
                print(f"[MIGRATION] Migrated {migrated_count} prices...")
    
    print(f"[MIGRATION] COMPLETED. {migrated_count} new price entries created.")

if __name__ == "__main__":
    asyncio.run(migrate_prices())
