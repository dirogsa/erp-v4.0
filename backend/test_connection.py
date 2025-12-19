import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_connection():
    mongo_uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("MONGO_DB_NAME", "system_db")
    
    print(f"Testing connection to MongoDB Atlas...")
    print(f"Database name: {db_name}")
    print(f"URI (masked): {mongo_uri[:30]}...{mongo_uri[-20:] if mongo_uri else 'NOT SET'}")
    
    if not mongo_uri:
        print("❌ ERROR: MONGODB_URI not set in .env file")
        return
    
    try:
        # Create client
        client = AsyncIOMotorClient(mongo_uri, serverSelectionTimeoutMS=5000)
        
        # Test connection
        await client.admin.command('ping')
        print("✅ Successfully connected to MongoDB Atlas!")
        
        # List databases
        db_list = await client.list_database_names()
        print(f"\n📚 Available databases: {db_list}")
        
        # Check if our database exists
        if db_name in db_list:
            print(f"✅ Database '{db_name}' exists")
            
            # List collections
            db = client[db_name]
            collections = await db.list_collection_names()
            print(f"📦 Collections in '{db_name}': {collections}")
        else:
            print(f"⚠️  Database '{db_name}' does not exist yet (will be created on first write)")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Connection failed: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_connection())
