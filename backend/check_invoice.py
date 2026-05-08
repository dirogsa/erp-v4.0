import asyncio
import os
import sys

# Add current directory to path
sys.path.append(os.getcwd())

from app.database import init_db
from app.models.sales import SalesInvoice

async def check():
    await init_db()
    # Find the invoice linked to GV-26-0047
    invoice = await SalesInvoice.find_one({"guide_id": "GV-26-0047"})
    if not invoice:
        # Try finding by looking at the guide directly
        from app.models.inventory import DeliveryGuide
        guide = await DeliveryGuide.find_one({"guide_number": "GV-26-0047"})
        if guide and guide.invoice_number:
            invoice = await SalesInvoice.find_one({"invoice_number": guide.invoice_number})
            
    if invoice:
        print(f"Invoice {invoice.invoice_number} found. Company: {invoice.company_id}")
        for item in invoice.items:
            print(f" - SKU: {item.product_sku}, Name: {item.product_name}")
            
        # Try finding these products in the database
        from app.models.inventory import Product
        for item in invoice.items:
            p = await Product.find_one({"sku": item.product_sku})
            if p:
                print(f"   [FOUND] Product {item.product_sku} exists in catalog.")
            else:
                print(f"   [MISSING] Product {item.product_sku} NOT in catalog!")
    else:
        print("Invoice NOT FOUND")

if __name__ == "__main__":
    asyncio.run(check())
