import os
from dotenv import load_dotenv
import pymongo
from pprint import pprint

load_dotenv()

uri = os.getenv("MONGODB_URI")
db_name = os.getenv("MONGO_DB_NAME", "erp_db")

print(f"Connecting to {uri}")
client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=5000)
db = client[db_name]

sku = "WA6004"
product = db.products.find_one({"sku": sku})

print("PRODUCT FOUND:")
pprint(product)

print("\n--- Why it wouldn't show up in shop? ---")
if product:
    print(f"is_active_in_shop == {product.get('is_active_in_shop')}")
    print(f"type == '{product.get('type')}'")
    
print("\nShop endpoint count check (is_active_in_shop=True):")
count = db.products.count_documents({"is_active_in_shop": True, "type": "COMMERCIAL"})
print(f"Total active commercial products: {count}")

count2 = db.products.count_documents({"is_active_in_shop": True})
print(f"Total active products (any type): {count2}")

count3 = db.products.count_documents({})
print(f"Total products overall: {count3}")

