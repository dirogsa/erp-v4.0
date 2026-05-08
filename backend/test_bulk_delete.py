import asyncio
import os
import sys

# Add current directory to path
sys.path.append(os.getcwd())

from app.database import init_db
from app.services import delivery_service

async def test():
    await init_db()
    guide_numbers = ["GV-26-0070", "GV-26-0069"]
    company_id = None # Let's try with None first as seen in debug
    
    print(f"Testing bulk_delete_guides with {guide_numbers}...")
    try:
        result = await delivery_service.bulk_delete_guides(guide_numbers, company_id=company_id)
        print("RESULT:", result)
    except Exception as e:
        print("CRITICAL ERROR:", str(e))

if __name__ == "__main__":
    asyncio.run(test())
