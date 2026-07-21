import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    try:
        uri = "mongodb+srv://db_user:Admin123!@erpcluster.zggrz5h.mongodb.net/?retryWrites=true&w=majority&appName=erpCluster"
        client = AsyncIOMotorClient(uri)
        db = client["erp_db"]
        products = db.products
        
        count = await products.count_documents({"sku": "WL7177"})
        print(f"Total WL7177 products in DB: {count}")
        
        docs = await products.find({"sku": "WL7177"}).to_list(length=10)
        for d in docs:
            print(f"ID: {d.get('_id')}, Name: {d.get('name')}, SKU: {d.get('sku')}")
            
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(main())
