import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import os
import sys
from datetime import date

# Add project root to path
sys.path.append(os.getcwd())

from backend.app.models.pricing import PriceList, PriceEntry, PricingRule
from backend.app.models.inventory import Product
from backend.app.models.company import Company
from backend.app.models.finance import ExchangeRate
from backend.app.models.sales import SalesPolicy
from backend.app.core.config import settings
from backend.app.services.pricing_service import get_product_price_for_user

async def verify():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGO_DB_NAME]
    await init_beanie(database=db, document_models=[PriceList, PriceEntry, Product, Company, ExchangeRate, PricingRule, SalesPolicy])
    
    # 1. Setup Test Data
    # Create a Test Company in USD
    test_ruc = "12345678901"
    company = await Company.find_one(Company.ruc == test_ruc)
    if not company:
        company = Company(name="Test USD Corp", ruc=test_ruc, functional_currency="USD")
        await company.insert()
    else:
        company.functional_currency = "USD"
        await company.save()
        
    # Create a Test Product
    test_sku = "TEST-CURRENCY-001"
    product = await Product.find_one(Product.sku == test_sku)
    if not product:
        product = Product(sku=test_sku, name="Test Item", brand="TEST")
        await product.insert()
        
    # Create a Master Price List
    master_list = await PriceList.find_one(PriceList.is_master == True)
    
    # Create a Price Entry in PEN
    price_val = 100.0 # 100 Soles
    entry = await PriceEntry.find_one(PriceEntry.sku == test_sku, PriceEntry.price_list_id == master_list.id)
    if entry:
        entry.price = price_val
        entry.currency = "PEN"
        await entry.save()
    else:
        entry = PriceEntry(product_id=product.id, sku=test_sku, price_list_id=master_list.id, price=price_val, currency="PEN")
        await entry.insert()
        
    # Create Exchange Rate
    # If Product is PEN and Company is USD -> Price / Purchase
    purchase_rate = 3.70
    sale_rate = 3.80
    today = date.today()
    tc = await ExchangeRate.find_one(ExchangeRate.date == today)
    if tc:
        tc.purchase = purchase_rate
        tc.sale = sale_rate
        await tc.save()
    else:
        tc = ExchangeRate(date=today, purchase=purchase_rate, sale=sale_rate)
        await tc.insert()
        
    # 2. Execute Test
    print(f"\n--- TESTING CONVERSION ---")
    print(f"Product Price: {price_val} {entry.currency}")
    print(f"Company Currency: {company.functional_currency}")
    print(f"Exchange Rate (Purchase): {purchase_rate}")
    
    final_price = await get_product_price_for_user(product, 1, None, company_id=test_ruc)
    
    expected = round(price_val / purchase_rate, 3)
    print(f"Final Price: {final_price} USD")
    print(f"Expected: {expected} USD")
    
    if abs(final_price - expected) < 0.001:
        print("[OK] SUCCESS: Conversion is accurate.")
    else:
        print("[ERR] FAILURE: Conversion mismatch.")

if __name__ == "__main__":
    asyncio.run(verify())
