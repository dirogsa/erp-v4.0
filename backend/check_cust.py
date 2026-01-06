
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import os
from dotenv import load_dotenv

# Use absolute path for .env if needed, but assuming it's in the root
load_dotenv(dotenv_path="backend/.env")

from app.models.sales import Customer
from app.models.inventory import Product
from app.models.auth import User

async def check():
    uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("MONGO_DB_NAME")
    print(f"Connecting to: {uri[:20]}... DB: {db_name}")
    client = AsyncIOMotorClient(uri)
    await init_beanie(database=client[db_name], document_models=[Customer, Product, User])
    
    ruc = "20501158012"
    customer = await Customer.find_one(Customer.ruc == ruc)
    if customer:
        print(f"Customer Found: {customer.name}")
        print(f"Address: {customer.address}")
        print(f"Branches: {customer.branches}")
    else:
        print("Customer not found")

if __name__ == "__main__":
    asyncio.run(check())
