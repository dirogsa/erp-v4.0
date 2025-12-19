import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def test_conn():
    uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("MONGO_DB_NAME", "erp_db")
    
    if not uri:
        print("FAIL: MONGODB_URI not found")
        return

    print(f"Testing connection to: {uri[:20]}... (hidden)")
    try:
        client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
        # The ismaster command is cheap and does not require auth.
        await client[db_name].command("ismaster")
        print("SUCCESS: Connected to MongoDB")
    except Exception as e:
        print(f"FAIL: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_conn())
