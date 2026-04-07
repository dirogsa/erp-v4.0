
import asyncio
import motor.motor_asyncio
from beanie import init_beanie
from app.models.inventory import Product
import os
from dotenv import load_dotenv

async def check():
    load_dotenv()
    db_uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("DB_NAME", "erp_db")
    
    print(f"Connecting to {db_name}...")
    client = motor.motor_asyncio.AsyncIOMotorClient(db_uri)
    await init_beanie(database=client[db_name], document_models=[Product])
    
    sku = "WA6004"
    product = await Product.find_one(Product.sku == sku)
    
    if product:
        print(f"Product found: {product.sku}")
        print(f"Name: {product.name}")
        print(f"Type: {product.type}")
        print(f"Is Active in Shop: {product.is_active_in_shop}")
        print(f"Brand: {product.brand}")
        print(f"Category ID: {product.category_id}")
        
        # Simulating the search query
        search = "WA6004"
        s = search.strip()
        query = {"is_active_in_shop": True}
        
        # Replicating logic from shop.py
        query["$or"] = [
            {"sku": s},
            {"sku": {"$regex": s, "$options": "i"}},
            {"name": {"$regex": s, "$options": "i"}},
            {"brand": {"$regex": s, "$options": "i"}},
            {"equivalences.code": {"$regex": s, "$options": "i"}},
            {"applications.make": {"$regex": s, "$options": "i"}},
            {"applications.model": {"$regex": s, "$options": "i"}},
            {"specs.value": {"$regex": s, "$options": "i"}}
        ]
        
        if not (search and len(search) > 4):
            query["type"] = "COMMERCIAL"
            
        print(f"Query for '{search}': {query}")
        
        match = await Product.find_one(query)
        if match:
            print("MATCH FOUND with query!")
        else:
            print("NO MATCH with query.")
            
            # Why no match?
            if not product.is_active_in_shop:
                print("REASON: is_active_in_shop is False")
            
            # Check for type filter
            if "type" in query and product.type != query["type"]:
                print(f"REASON: type mismatch. Product type is {product.type}, query expects {query['type']}")
                
    else:
        print(f"Product {sku} NOT FOUND in database.")

if __name__ == "__main__":
    asyncio.run(check())
