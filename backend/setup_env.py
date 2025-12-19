import os

content = """MONGODB_URI=mongodb+srv://db_user:Admin123!@erpcluster.zggrz5h.mongodb.net/?retryWrites=true&w=majority&appName=erpCluster
MONGO_DB_NAME=erp_db
"""

with open('.env', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ .env actualizado correctamente")
