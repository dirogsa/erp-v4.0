import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def run_fix():
    uri = "mongodb+srv://db_user:Admin123!@erpcluster.zggrz5h.mongodb.net/?retryWrites=true&w=majority&appName=erpCluster"
    db_name = "erp_db"
    print(f"Connecting to {uri}...")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    # 1. First find it
    term = "WA6172"
    query = {"$or": [{"sku": term}, {"equivalences.code": term}]}
    prod = await db.products.find_one(query)
    
    if prod:
        print(f"Found: {prod['sku']} | ActiveInShop: {prod.get('is_active_in_shop')} | Type: {prod.get('type')}")
        res = await db.products.update_one({"_id": prod["_id"]}, {"$set": {"is_active_in_shop": True, "type": "COMMERCIAL"}})
        print(f"Updated! Matched: {res.matched_count}, Modified: {res.modified_count}")
        
        # Check current search query logic
        from app.models.inventory import Product
        # simulates searching
    else:
        print("Product WA6172 not found in DB.")

if __name__ == "__main__":
    asyncio.run(run_fix())
