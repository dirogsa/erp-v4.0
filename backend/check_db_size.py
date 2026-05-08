import asyncio
import os
import sys

# Add current directory to path
sys.path.append(os.getcwd())

from app.database import init_db
from app.models.inventory import Product

async def check():
    await init_db()
    count = await Product.find_all().count()
    print(f"Total products in DB: {count}")

if __name__ == "__main__":
    asyncio.run(check())
