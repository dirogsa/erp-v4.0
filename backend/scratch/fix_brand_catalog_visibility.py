import os
from pymongo import MongoClient

# Cargar variables desde el archivo .env
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
mongo_uri = None
db_name = 'erp_db'

if os.path.exists(env_path):
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            if line.startswith('MONGODB_URI='):
                mongo_uri = line.split('=', 1)[1].strip()
            elif line.startswith('MONGO_DB_NAME='):
                db_name = line.split('=', 1)[1].strip()

if not mongo_uri:
    print("❌ No se encontró MONGODB_URI en el archivo .env. Usando conexión local...")
    mongo_uri = "mongodb://localhost:27017"

print(f"Connecting to MongoDB database: {db_name}")
client = MongoClient(mongo_uri)
db = client[db_name]
coll = db['product_brands']

# 1. Lista de marcas reales de filtros que vendes
allowed_brands = [
    "WIX",
    "MANN",
    "MANN-FILTER",
    "AZUMI",
    "TOTACHI",
    "ASAKASHI",
    "MAHLE",
    "FILTRON",
    "FILTROW",
    "GENERICO",
    "GENERIC",
    "LYS",
    "OEM"
]

# Normalizamos a mayúsculas para evitar problemas de case sensitivity
allowed_brands_upper = [b.upper() for b in allowed_brands]

# 2. Desactivar visibilidad de catálogo para TODOS por defecto
result_all = coll.update_many({}, {"$set": {"show_in_catalog": False}})
print(f"Desactivada visibilidad para {result_all.modified_count} marcas en total.")

# 3. Activar visibilidad de catálogo únicamente para las marcas de filtros reales
regex_conditions = [{"name": {"$regex": f"^{b}$", "$options": "i"}} for b in allowed_brands_upper]
query = {"$or": regex_conditions}

result_allowed = coll.update_many(query, {"$set": {"show_in_catalog": True}})
print(f"Activada visibilidad para {result_allowed.modified_count} marcas comerciales de filtros.")

# Mostrar resumen final de marcas activas
active_brands = coll.distinct("name", {"show_in_catalog": True})
print(f"\nMarcas activas en el catalogo web ({len(active_brands)}):")
for b in sorted(active_brands):
    print(f" - {b}")

client.close()
