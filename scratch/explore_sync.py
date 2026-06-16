import pymongo

import pymongo

try:
    client = pymongo.MongoClient('mongodb+srv://db_user:Admin123!@erpcluster.zggrz5h.mongodb.net/?retryWrites=true&w=majority&appName=erpCluster', serverSelectionTimeoutMS=5000)
    db = client['erp_db'] # Or erp_v4_db? Let's check databases
    cats = list(db['product_categories'].find())
    print(f"Found {len(cats)} categories in erp_db")
    for c in cats:
        print(f"- {c.get('name')} (parent: {c.get('parent_id')})")
        
    if len(cats) == 0:
        cats2 = list(client['erp_system'].product_categories.find())
        print(f"Found {len(cats2)} categories in erp_system")
        for c in cats2:
            print(f"- {c.get('name')} (parent: {c.get('parent_id')})")
except Exception as e:
    print("Error:", e)
