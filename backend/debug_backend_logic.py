import asyncio
import os
from dotenv import load_dotenv
from app.database import init_db
from app.services import inventory_service
import sys

# Force unbuffered stdout
sys.stdout.reconfigure(line_buffering=True)

load_dotenv()

async def debug_products():
    print("--- DEBUGGING BACKEND LOGIC ---")
    
    print("1. Initializing DB...")
    try:
        await init_db()
        print("✅ DB Initialized")
    except Exception as e:
        print(f"❌ DB Init Failed: {e}")
        return

    print("\n2. Calling get_products(skip=0, limit=10)...")
    try:
        # Simulate the call with defaults (search=None, category=None)
        # Note: API might pass empty string "" instead of None, let's test both if needed.
        # User url had search= so likely empty string.
        # But wait, python logic `if search:` handles "" same as None.
        
        result = await inventory_service.get_products(0, 10, "", None)
        print(f"✅ Success! Total products: {result.total}")
        print(f"Items found: {len(result.items)}")
        for p in result.items:
            print(f" - {p.name} ({p.sku})")
            
    except Exception as e:
        print(f"❌ ERROR in get_products: {type(e).__name__}")
        print(f"Message: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Add project root to path so imports work
    sys.path.append(os.getcwd())
    asyncio.run(debug_products())
