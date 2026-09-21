from pymongo import MongoClient
client = MongoClient('mongodb://localhost:27017')
db = client.erp_db
result = db.Customer.update_one({'document_number': '20616479751'}, {'$set': {'name': 'CENZA INVERSIONES PERU E.I.R.L.'}})
print(f'Matched: {result.matched_count}, Modified: {result.modified_count}')
