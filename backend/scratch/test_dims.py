import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.engines.dims_engine import DIMSEngine
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.inventory import Product
from beanie import init_beanie

async def main():
    uri = "mongodb+srv://db_user:Admin123!@erpcluster.zggrz5h.mongodb.net/?retryWrites=true&w=majority&appName=erpCluster"
    client = AsyncIOMotorClient(uri)
    db = client["erp_db"]
    await init_beanie(database=db, document_models=[Product])
    
    res = await DIMSEngine.find_alternatives("WL7177", "low")
    print("Alternatives for WL7177:")
    for alt in res.get("dimensional_similarities", []):
        print(f"SKU: {alt['sku']}, Name: {alt['name']}, Score: {alt['similarity_score']}")

if __name__ == "__main__":
    asyncio.run(main())
