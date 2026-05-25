import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from dotenv import load_dotenv

# Aseguramos cargar las variables de entorno
load_dotenv()

# Importamos el modelo Product
from app.models.inventory import Product, Warehouse, VehicleBrand, StockMovement, PriceHistory, DeliveryGuide, ProductBrand

async def main():
    print("Iniciando script de corrección de dimensiones...")
    
    mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    database_name = os.getenv("MONGO_DB_NAME", "erp_db")
    
    print(f"Conectando a MongoDB en {mongo_uri} (Base de datos: {database_name})")
    
    client = AsyncIOMotorClient(mongo_uri)
    await init_beanie(database=client[database_name], document_models=[
        Product, Warehouse, VehicleBrand, StockMovement, PriceHistory, DeliveryGuide, ProductBrand
    ])
    
    # Mapa de corrección inverso
    correction_map = {
        "Diámetro Exterior": "A",
        "Diámetro Interior 1": "B",
        "Diámetro Interior 2": "C",
        "Altura": "H",
        "Rosca": "G"
    }
    
    products = await Product.find({"specs": {"$exists": True, "$ne": []}}).to_list()
    print(f"Se encontraron {len(products)} productos con especificaciones. Analizando...")
    
    updated_count = 0
    
    for p in products:
        needs_update = False
        
        for spec in p.specs:
            if spec.label in correction_map:
                old_label = spec.label
                spec.label = correction_map[spec.label]
                needs_update = True
                print(f"[{p.sku}] Cambiando '{old_label}' a '{spec.label}'")
        
        if needs_update:
            await p.save()
            updated_count += 1
            
    print(f"\n¡Proceso finalizado! Se corrigieron las dimensiones de {updated_count} productos exitosamente.")

if __name__ == "__main__":
    asyncio.run(main())
