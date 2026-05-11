import asyncio
from app.database import init_db
from app.models.config import SystemConfig

async def check():
    await init_db()
    config = await SystemConfig.find_one({})
    if config:
        print(f"ALLOW_NEGATIVE_STOCK: {config.allow_negative_stock}")
    else:
        print("No configuration found.")

if __name__ == "__main__":
    asyncio.run(check())
