from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
db = client["erp_system"]

prod = db.products.find_one({"sku": "LF260"})
if prod:
    print(f"Product type: {prod.get('type')}, brand: {prod.get('brand')}")
else:
    print("Product LF260 not found")
    
inv = db.sales_invoices.find_one({"sunat_number": "E001-734"})
if inv:
    print(f"Invoice E001-734 found")
    for i, item in enumerate(inv.get('items', [])):
        print(f"Item {i}: sku={item.get('product_sku')}, brand={item.get('brand')}, is_unmapped={item.get('is_unmapped')}")
else:
    print("Invoice E001-734 not found")

inv2 = db.sales_invoices.find_one({"sunat_number": "E001-733"})
if inv2:
    print(f"Invoice E001-733 found")
    for i, item in enumerate(inv2.get('items', [])):
        print(f"Item {i}: sku={item.get('product_sku')}, brand={item.get('brand')}, is_unmapped={item.get('is_unmapped')}")

