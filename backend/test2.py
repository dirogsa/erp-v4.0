import asyncio
from app.services.inventory_service import get_products
from app.models.inventory import Product
from app.models.pricing import PriceList, PriceEntry
from app.models.company import Company
import beanie
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient('mongodb+srv://db_user:Admin123!@erpcluster.zggrz5h.mongodb.net/?retryWrites=true&w=majority&appName=erpCluster')
    await beanie.init_beanie(database=client.erp_db, document_models=[Product, PriceList, PriceEntry, Company])
    res = await get_products(search='28113-D3300', company_id='69f384c1899f67fbdb33e8d8')
    print('Total:', res.total)
    print('Items:', res.items)

asyncio.run(main())
