from pymongo import MongoClient

def fix_db():
    uri = "mongodb+srv://db_user:Admin123!@erpcluster.zggrz5h.mongodb.net/?retryWrites=true&w=majority&appName=erpCluster"
    client = MongoClient(uri)
    db = client.erp_db
    result = db.customers.update_one(
        {'document_number': '20616479751'},
        {'$set': {'name': 'CENZA INVERSIONES PERU E.I.R.L.'}}
    )
    print(f'Matched: {result.matched_count}, Modified: {result.modified_count}')

if __name__ == "__main__":
    fix_db()
