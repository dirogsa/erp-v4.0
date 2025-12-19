import asyncio
import os
import sys

# Add current directory to path so we can import app modules
sys.path.append(os.getcwd())

from app.database import init_db
from app.models.inventory import Product

async def main():
    print("Initializing DB...", flush=True)
    await init_db()
    
    # Check a product
    print("\nChecking a product...", flush=True)
    product = await Product.find_one({})
    if product:
        print(f"Product: {product.name}", flush=True)
        print(f"Retail Price (Model): {product.price_retail}", flush=True)
        print(f"Dump: {product.model_dump()}", flush=True)
    
    quote_number = "CV-25-0001"
    print(f"\nFetching quote {quote_number}...", flush=True)
    quote = await SalesQuote.find_one(SalesQuote.quote_number == quote_number)
    
    if not quote:
        print("Quote not found!", flush=True)
        return

    print(f"Quote Items ({len(quote.items)}):", flush=True)
    for item in quote.items:
        print(f" - SKU: {item.product_sku}, Qty: {item.quantity}, Price: {item.unit_price}", flush=True)
        
    check_items = [
        {"product_sku": item.product_sku, "quantity": item.quantity, "unit_price": item.unit_price} 
        for item in quote.items
    ]
    
    if not check_items:
        print("WARNING: Check items list is empty!", flush=True)
    
    print("\nChecking stock availability...", flush=True)
    try:
        result = await check_stock_availability(check_items)
        print("Result:", flush=True)
        print(result, flush=True)
    except Exception as e:
        print(f"Error checking stock: {e}", flush=True)

if __name__ == "__main__":
    asyncio.run(main())
