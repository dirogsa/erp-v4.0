import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    try:
        uri = "mongodb+srv://db_user:Admin123!@erpcluster.zggrz5h.mongodb.net/?retryWrites=true&w=majority&appName=erpCluster"
        client = AsyncIOMotorClient(uri)
        db = client["erp_db"]
        products = db.products
        
        wl7131 = await products.find_one({"sku": "WL7131"})
        wl7177 = await products.find_one({"sku": "WL7177"})
        
        print("--- WL7131 ---")
        if wl7131:
            print("Category:", wl7131.get("category_name"))
            for s in wl7131.get("specs", []):
                print(f"  {s['label']}: {s['value']} ({type(s['value']).__name__})")
        else:
            print("Not found")
            
        print("\n--- WL7177 ---")
        if wl7177:
            print("Category:", wl7177.get("category_name"))
            for s in wl7177.get("specs", []):
                print(f"  {s['label']}: {s['value']} ({type(s['value']).__name__})")
        else:
            print("Not found")
            
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(main())
