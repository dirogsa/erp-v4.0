import asyncio
import os
import sys

# Add current directory to path
sys.path.append(os.getcwd())

from app.database import init_db
from app.models.inventory import DeliveryGuide, Product
from app.services import inventory_service

async def check():
    await init_db()
    guide_number = "GV-26-0047"
    guide = await DeliveryGuide.find_one(DeliveryGuide.guide_number == guide_number)
    if not guide:
        print(f"Guide {guide_number} NOT FOUND in DB")
        return
        
    print(f"Guide {guide_number} found. Status: {guide.status}, Company: {guide.company_id}")
    print(f"Items: {len(guide.items)}")
    for item in guide.items:
        print(f" - SKU: {item.sku}, Quantity: {item.quantity}")
        product = await inventory_service.find_product_robustly(item.sku, company_id=guide.company_id)
        if product:
            print(f"   [SUCCESS] Product found in inventory_service")
        else:
            print(f"   [FAILURE] Product NOT FOUND in inventory_service")
            # Try finding manually
            p_manual = await Product.find_one({"sku": item.sku})
            if p_manual:
                print(f"   [DEBUG] Found manually with SKU {item.sku}. Brand: {p_manual.brand}")
            else:
                print(f"   [DEBUG] NOT found manually even with raw SKU")

if __name__ == "__main__":
    asyncio.run(check())
