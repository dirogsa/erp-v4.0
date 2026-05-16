import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.finance import ExchangeRate
import os
from dotenv import load_dotenv

async def check_rates():
    load_dotenv()
    uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("MONGO_DB_NAME", "erp_db")
    client = AsyncIOMotorClient(uri)
    await init_beanie(database=client[db_name], document_models=[ExchangeRate])
    
    rates = await ExchangeRate.find_all().to_list()
    print(f"Total rates: {len(rates)}")
    for r in rates:
        print(f"Date: {r.date}, Purchase: {r.purchase}, Sale: {r.sale}")

if __name__ == "__main__":
    asyncio.run(check_rates())
