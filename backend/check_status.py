
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def check():
    uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("MONGO_DB_NAME", "erp_db")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    sku = "WA6004"
    product = await db.products.find_one({"sku": sku})
    
    with open("check_output.txt", "w") as f:
        if product:
            f.write(f"FOUND: {product['sku']}\n")
            f.write(f"is_active_in_shop: {product.get('is_active_in_shop')}\n")
            f.write(f"type: {product.get('type')}\n")
        else:
            equiv = await db.products.find_one({"equivalences.code": sku})
            if equiv:
                f.write(f"FOUND AS EQUIV in: {equiv['sku']}\n")
                f.write(f"is_active_in_shop: {equiv.get('is_active_in_shop')}\n")
                f.write(f"type: {equiv.get('type')}\n")
            else:
                f.write("NOT FOUND AT ALL\n")

if __name__ == "__main__":
    asyncio.run(check())
