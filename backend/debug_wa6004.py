
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
from dotenv import load_dotenv

load_dotenv()

async def debug_product():
    uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("MONGO_DB_NAME", "erp_db")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    term = "WA6004"
    print(f"Buscando '{term}'...")
    
    # Broad search
    cursor = db.products.find({
        "$or": [
            {"sku": {"$regex": term, "$options": "i"}},
            {"name": {"$regex": term, "$options": "i"}},
            {"equivalences.code": {"$regex": term, "$options": "i"}}
        ]
    })
    
    products = await cursor.to_list(length=100)
    
    result = {
        "count": len(products),
        "products": []
    }
    
    for p in products:
        p["_id"] = str(p["_id"]) # convert ObjectId to string
        result["products"].append(p)
        
    with open("debug_wa6004_results.json", "w", encoding="utf-8") as f:
        json.dump(result, f, indent=4, default=str)
        
    print(f"Hecho. Resultados guardados en debug_wa6004_results.json")

if __name__ == "__main__":
    asyncio.run(debug_product())
