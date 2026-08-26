import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath('.'))
from app.models.inventory import Product
from app.db.mongodb import connect_to_mongo

async def run():
    await connect_to_mongo()
    # Find a product with VW (VOLKSWAGEN)
    p = await Product.find_one({"applications.make": {"$regex": "VOLKSWAGEN", "$options": "i"}})
    if p:
        for app in p.applications:
            if 'VOLKSWAGEN' in app.make.upper():
                print(f"Make in DB: '{app.make}'")
                print(f"Model in DB: '{app.model}'")
    else:
        print("No product found.")

asyncio.run(run())
