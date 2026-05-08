import asyncio
import os
import sys

# Añadir el path del backend para poder importar los modelos
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.database import init_db
from app.models.inventory import ProductCategory

async def fix_categories():
    print("Iniciando normalizacion de Taxonomia Industrial...")
    await init_db()
    
    # Buscar categorías con parent_id ""
    categories_to_fix = await ProductCategory.find(ProductCategory.parent_id == "").to_list()
    
    if not categories_to_fix:
        print("OK: No se encontraron categorias con inconsistencias. Todo esta en orden.")
        return

    print(f"INFO: Se encontraron {len(categories_to_fix)} categorias para corregir.")
    
    for cat in categories_to_fix:
        print(f"  - Corrigiendo: {cat.name} ('' -> null)")
        cat.parent_id = None
        await cat.save()
    
    print("DONE: Normalizacion completada con exito.")

if __name__ == "__main__":
    asyncio.run(fix_categories())
