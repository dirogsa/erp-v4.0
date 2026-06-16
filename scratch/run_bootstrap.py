import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient

# Add app directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.database import init_db
from app.core.bootstrap import bootstrap_system

async def main():
    sys.stdout.reconfigure(encoding='utf-8')
    print("Initializing DB...")
    await init_db()
    print("Running system bootstrap...")
    await bootstrap_system()
    print("Bootstrap finished successfully!")

asyncio.run(main())
