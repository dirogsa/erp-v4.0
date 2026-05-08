import asyncio
import os
import sys

# Add current directory to path
sys.path.append(os.getcwd())

from app.database import init_db
from app.models.inventory import Product

async def check():
    await init_db()
    skus = ["NS60L770", "48I1000", "42I900", "MF57412", "MF65B24L"]
    for sku in skus:
        p = await Product.find_one({"equivalences.code": sku})
        if p:
            print(f" [FOUND IN EQUIVALENCES] SKU {sku} belongs to Product {p.sku} ({p.brand})")
        else:
            # Try searching with parts
            partial = sku[:5]
            p_part = await Product.find_one({"sku": {"$regex": partial}})
            if p_part:
                print(f" [PARTIAL MATCH] SKU {sku} not found, but found {p_part.sku} ({p_part.brand})")

if __name__ == "__main__":
    asyncio.run(check())
