import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

# Importa todos los modelos que tienen índices declarados
from app.models.inventory import Product
from app.models.pricing import PriceEntry
from app.models.sales import SalesInvoice

MONGO_URI = "mongodb://localhost:27017/dirogsa"

async def main():
    client = AsyncIOMotorClient(MONGO_URI)
    # init_beanie crea los índices definidos en los modelos si la colección no existe aún
    await init_beanie(database=client.dirogsa, document_models=[Product, PriceEntry, SalesInvoice])
    await client.close()
    print("✅ Índices asegurados para Product, PriceEntry y SalesInvoice")

if __name__ == "__main__":
    asyncio.run(main())
