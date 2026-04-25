import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def deduplicate_categories():
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client.erp_db
    collection = db.product_categories

    print("Finding duplicates...")
    pipeline = [
        {"$group": {"_id": "$name", "count": {"$sum": 1}, "ids": {"$push": "$_id"}}},
        {"$match": {"count": {"$gt": 1}}}
    ]
    
    duplicates = await collection.aggregate(pipeline).to_list(None)
    
    if not duplicates:
        print("No duplicates found.")
        return

    for dup in duplicates:
        name = dup["_id"]
        ids = dup["ids"]
        print(f"Found {len(ids)} duplicates for category: '{name}'")
        
        # Keep the first one, delete the rest
        for doc_id in ids[1:]:
            await collection.delete_one({"_id": doc_id})
            print(f" Deleted {doc_id}")

    print("Deduplication complete.")

if __name__ == "__main__":
    asyncio.run(deduplicate_categories())
