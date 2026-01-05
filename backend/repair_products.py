import asyncio
import os
import sys

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import init_db
from app.models.inventory import Product, ProductType

async def repair_product_types():
    print("Connecting to database...")
    await init_db()
    
    print("Checking for products with missing or null type...")
    
    # Update products that have NO type
    # Beanie might filter these out if the model definition is strict, but let's try finding raw first if possible
    # Actually Beanie find({}) finds all documents that match the model.
    # If field is Optional in model, it will be None.
    
    # We fetch ALL products and check content
    all_products = await Product.find_all().to_list()
    print(f"Scanned {len(all_products)} total products.")
    
    count_commercial = 0
    count_marketing = 0
    
    for p in all_products:
        if not p.type: # None or empty string
            # Heuristic: If it has zero price BUT has points cost, it's likely MARKETING
            # Or if SKU starts with PUB-
            is_marketing = False
            
            if p.sku.startswith("PUB-"):
                is_marketing = True
            elif p.points_cost and p.points_cost > 0:
                 # If it has points cost, it's a prize candidate.
                 # But some commercial products might have points cost? 
                 # For now, if price is 0, it's definitely marketing
                 if float(p.price_retail or 0) == 0:
                     is_marketing = True
            
            if is_marketing:
                p.type = ProductType.MARKETING
                count_marketing += 1
            else:
                p.type = ProductType.COMMERCIAL
                count_commercial += 1
                
            await p.save()
            print(f"Updated {p.sku} -> {p.type}")
        elif p.type == ProductType.MARKETING:
             # Just verify logic matches
             pass

    print(f"Repair complete. Set {count_commercial} to COMMERCIAL and {count_marketing} to MARKETING.")

if __name__ == "__main__":
    asyncio.run(repair_product_types())
