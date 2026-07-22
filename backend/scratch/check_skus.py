import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def main():
    client = AsyncIOMotorClient("mongodb+srv://d1r0gs4:a3D94bKqV70Fj5T@dirogsa-dev.4t2k1.mongodb.net/?retryWrites=true&w=majority&appName=dirogsa-dev")
    db = client["dirogsa_erp"]
    
    for sku in ["WF8099", "WF8032"]:
        product = await db.products.find_one({"sku": sku})
        if product:
            print(f"--- SKU: {sku} ---")
            print(f"Category: {product.get('category_name')}")
            print(f"Specs: {product.get('specs')}")
        else:
            print(f"SKU {sku} not found")

if __name__ == "__main__":
    asyncio.run(main())
