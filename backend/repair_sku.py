import asyncio
from app.database import init_db
from app.models.inventory import Product, ProductType
from beanie import PydanticObjectId

async def repair_catalog():
    print("Iniciando reparación de catálogo...")
    await init_db()
    
    sku = "NS60L770"
    existing = await Product.find_one(Product.sku == sku)
    
    if not existing:
        print(f"Resucitando producto faltante: {sku}")
        new_product = Product(
            sku=sku,
            name="PRODUCTO RECUPERADO (Legacy)",
            brand="GENERIC",
            product_type=ProductType.COMMERCIAL,
            stock_current=0, # Empezamos en 0, el despacho lo pondrá en negativo si allow_negative_stock=True
            cost=191.63,
            price=250.00,
            unit="UND",
            company_id=None # Global
        )
        await new_product.insert()
        print(f"SUCCESS: Producto {sku} creado satisfactoriamente.")
    else:
        print(f"El producto {sku} ya existe. El error podría ser otro.")

if __name__ == "__main__":
    asyncio.run(repair_catalog())
