import asyncio
import os
import sys

# Añadir el path del backend para poder importar los modelos
sys.path.append(os.getcwd())

from app.database import init_db
from app.models.inventory import ProductCategory

async def repair_taxonomy():
    print("START: Iniciando reparacion de taxonomia...")
    await init_db()
    
    categories = await ProductCategory.find_all().to_list()
    count = 0
    
    for cat in categories:
        modified = False
        if not cat.import_aliases:
            cat.import_aliases = []
            modified = True
            
        if cat.name not in cat.import_aliases:
            cat.import_aliases.append(cat.name)
            modified = True
            
        if modified:
            await cat.save()
            print(f"FIXED: '{cat.name}' -> Aliases: {cat.import_aliases}")
            count += 1
        else:
            print(f"INFO: Saltada (Ya OK): '{cat.name}'")
            
    print(f"\nDONE: Reparacion finalizada. {count} categorias actualizadas.")

if __name__ == "__main__":
    asyncio.run(repair_taxonomy())
