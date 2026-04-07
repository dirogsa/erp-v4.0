import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pprint import pprint

load_dotenv()

async def debug_product():
    uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("MONGO_DB_NAME", "erp_db")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    sku = "WA6004"
    product = await db.products.find_one({"sku": sku})
    
    if product:
        print(f"--- Product Data directly from MongoDB for {sku} ---")
        print(f"SKU: {product.get('sku')}")
        print(f"Name: {product.get('name')}")
        print(f"Is Active in Shop: {product.get('is_active_in_shop')} (Type: {type(product.get('is_active_in_shop'))})")
        print(f"Type: {product.get('type')}")
        print(f"Status: {product.get('status')}")
    else:
        print(f"Product {sku} not found directly by SKU")
        
    print("\n--- Shop endpoint query check ---")
    query = {"is_active_in_shop": True, "type": "COMMERCIAL", "sku": sku}
    shop_count = await db.products.count_documents(query)
    print(f"Count with strictly is_active_in_shop=True and type=COMMERCIAL: {shop_count}")
    
    # Try finding it just by is_active_in_shop
    query2 = {"is_active_in_shop": True, "sku": sku}
    count2 = await db.products.count_documents(query2)
    print(f"Count with strictly is_active_in_shop=True: {count2}")

if __name__ == "__main__":
    asyncio.run(debug_product())
