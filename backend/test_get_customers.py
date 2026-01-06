import asyncio
import os
import sys

# Add the current directory to sys.path to find 'app'
sys.path.append(os.getcwd())

from dotenv import load_dotenv
load_dotenv()

from app.database import init_db
from app.services.sales_service import get_customers

async def main():
    print("Testing get_customers()...")
    try:
        await init_db()
        print("Database initialized.")
        
        customers = await get_customers()
        print(f"Successfully fetched {len(customers)} customers.")
        if customers:
            print("First customer sample:")
            print({k: v for k, v in customers[0].items() if k != 'branches'})
            
    except Exception as e:
        print("\n!!! ERROR DETECTED !!!")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
