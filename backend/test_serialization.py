
import asyncio
import os
import sys
from datetime import datetime
from dotenv import load_dotenv

# Add the current directory to sys.path
sys.path.append(os.getcwd())
load_dotenv()

from app.database import init_db
from app.services.sales_service import get_customers
from beanie import PydanticObjectId

async def main():
    print("--- STARTING SERIALIZATION TEST ---")
    try:
        await init_db()
        print("DB Initialized.")
        
        customers = await get_customers()
        print(f"Service returned {len(customers)} customers.")
        
        if not customers:
            print("No customers found.")
            return

        print("Checking first customer for non-serializable types...")
        first = customers[0]
        for k, v in first.items():
            if isinstance(v, PydanticObjectId):
                print(f"!!! FOUND PydanticObjectId in key: {k} !!!")
            elif isinstance(v, list):
                for i, item in enumerate(v):
                    if isinstance(item, dict):
                        for subk, subv in item.items():
                            if isinstance(subv, PydanticObjectId):
                                print(f"!!! FOUND PydanticObjectId in list item {i}, key: {subk} !!!")
        
        # Test actual JSON serialization
        import json
        try:
            json.dumps(customers, default=str)
            print("SUCCESS: Data is JSON serializable (using default=str fallback)")
            
            # Now test WITHOUT default=str to see if it fails like FastAPI (which should handle it but evidently didn't in user's log)
            try:
                json.dumps(customers)
                print("SUCCESS: Data is strictly JSON serializable")
            except Exception as je:
                print(f"STRICT JSON FAILURE: {str(je)}")
                
        except Exception as je:
            print(f"JSON SERIALIZATION FAILED: {str(je)}")

    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
