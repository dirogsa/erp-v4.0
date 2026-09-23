"""
Script de Gestión de Índices — DIROGSA ERP
==========================================
Gestiona el índice de Atlas Search con NGram analyzer para búsqueda de catálogo de repuestos.

El NGram analyzer descompone "WA6004" en todos sus substrings durante la indexación:
  WA6004 → ["wa", "wa6", "wa60", "wa600", "wa6004", "a6", "a60", ..., "6004", "004"]

Esto permite que buscar "6004" encuentre "WA6004" sin wildcards ni lógica especial.

Uso:
    python -X utf8 setup_search_index.py              # Listar todos los índices
    python -X utf8 setup_search_index.py --rebuild    # Borrar el viejo y crear el nuevo NGram
"""

import sys
import time
from pymongo import MongoClient
from pymongo.operations import SearchIndexModel

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# ─── Configuración ────────────────────────────────────────────────────────────
MONGODB_URI = "mongodb+srv://db_user:Admin123!@erpcluster.zggrz5h.mongodb.net/?retryWrites=true&w=majority&appName=erpCluster"
DB_NAME     = "erp_db"
POSSIBLE_COLLECTION_NAMES = ["Product", "products"]
INDEX_NAME  = "default"

# ─── Definición del Índice NGram ──────────────────────────────────────────────
#
# Arquitectura de búsqueda:
#
# Campos de código (sku, equivalencias):
#   - Indexación: NGram (min=2, max=15) + lowercase
#     → Almacena todos los substrings: "WA6004" → "wa","wa6","wa60","wa600","wa6004","a6",...,"6004","004"
#   - Búsqueda: keyword + lowercase
#     → "6004" se convierte en token "6004" → coincide con ngram "6004" del índice → ✅ encuentra WA6004
#
# Campos de texto (nombre, marca):
#   - Indexación: lucene.standard (tokeniza y normaliza palabras)
#   - Búsqueda: lucene.standard
#
ATLAS_SEARCH_INDEX_DEFINITION = {
    "name": INDEX_NAME,
    "definition": {
        # Analizadores personalizados
        "analyzers": [
            {
                # Para indexar: descompone en todos los substrings posibles (NGram)
                "name": "ngram_code_index",
                "charFilters": [],
                "tokenizer": {
                    "type": "nGram",
                    "minGram": 2,
                    "maxGram": 15
                },
                "tokenFilters": [
                    {"type": "lowercase"}
                ]
            },
            {
                # Para buscar: toma el término completo como un solo token y lo normaliza
                "name": "keyword_lowercase_search",
                "charFilters": [],
                "tokenizer": {"type": "keyword"},
                "tokenFilters": [
                    {"type": "lowercase"}
                ]
            }
        ],
        "mappings": {
            "dynamic": False,
            "fields": {
                # ── Campos de CÓDIGO (NGram para búsqueda por substring) ──────────────
                "sku": {
                    "type": "string",
                    "analyzer": "ngram_code_index",
                    "searchAnalyzer": "keyword_lowercase_search"
                },
                "clean_sku": {
                    "type": "string",
                    "analyzer": "ngram_code_index",
                    "searchAnalyzer": "keyword_lowercase_search"
                },
                "sku_canonical": {
                    "type": "string",
                    "analyzer": "ngram_code_index",
                    "searchAnalyzer": "keyword_lowercase_search"
                },

                # ── Equivalencias OEM/Aftermarket ────────────────────────────────────
                "equivalences": {
                    "type": "embeddedDocuments",
                    "fields": {
                        "code": {
                            "type": "string",
                            "analyzer": "ngram_code_index",
                            "searchAnalyzer": "keyword_lowercase_search"
                        },
                        "brand": {
                            "type": "string",
                            "analyzer": "lucene.standard"
                        }
                    }
                },

                # ── Campos de TEXTO LIBRE (full-text standard) ───────────────────────
                "name":          {"type": "string", "analyzer": "lucene.standard"},
                "brand":         {"type": "string", "analyzer": "lucene.standard"},
                "category_name": {"type": "string", "analyzer": "lucene.standard"},

                # ── Filtros booleanos para el $match post-search ──────────────────────
                "is_active_in_shop": {"type": "boolean"},
                "type":              {"type": "string", "analyzer": "lucene.keyword"}
            }
        }
    }
}

# ─── Colores ANSI ─────────────────────────────────────────────────────────────
CYAN   = "\033[96m"
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

def banner(text, color=CYAN):
    print(f"\n{color}{BOLD}{'─'*60}{RESET}")
    print(f"{color}{BOLD}  {text}{RESET}")
    print(f"{color}{BOLD}{'─'*60}{RESET}")

def find_products_collection(db):
    existing = db.list_collection_names()
    for name in POSSIBLE_COLLECTION_NAMES:
        if name in existing:
            return db[name], name
    for name in existing:
        if "product" in name.lower():
            return db[name], name
    return None, None

def list_all_indexes(collection, collection_name):
    banner(f"Índices Regulares (B-Tree) — {collection_name}")
    for idx in collection.list_indexes():
        name   = idx.get("name", "?")
        keys   = dict(idx.get("key", {}))
        unique = "[UNIQUE]" if idx.get("unique") else ""
        print(f"  {GREEN}✓{RESET} {BOLD}{name}{RESET} {unique}")
        for field, direction in keys.items():
            dir_str = "ASC" if direction == 1 else ("DESC" if direction == -1 else "TEXT")
            print(f"      {CYAN}↳{RESET} {field}: {dir_str}")

    banner(f"Índices Atlas Search — {collection_name}")
    try:
        indexes = list(collection.list_search_indexes())
        if not indexes:
            print(f"  {YELLOW}⚠  Sin índices de Atlas Search.{RESET}")
            return

        for idx in indexes:
            status = idx.get("status", "?")
            name   = idx.get("name", "?")
            color  = GREEN if status == "READY" else YELLOW
            print(f"  {color}● {BOLD}{name}{RESET}  [{color}{status}{RESET}]")
            definition = idx.get("latestDefinition", idx.get("definition", {}))
            analyzers  = [a["name"] for a in definition.get("analyzers", [])]
            fields     = list(definition.get("mappings", {}).get("fields", {}).keys())
            if analyzers:
                print(f"      Analizadores custom : {', '.join(analyzers)}")
            if fields:
                print(f"      Campos mapeados     : {', '.join(fields)}")
    except Exception as e:
        print(f"  {RED}✗ {e}{RESET}")

def drop_search_index(collection):
    try:
        existing = list(collection.list_search_indexes())
        for idx in existing:
            if idx.get("name") == INDEX_NAME:
                collection.drop_search_index(INDEX_NAME)
                print(f"  {YELLOW}✓ Índice '{INDEX_NAME}' eliminado. Esperando propagación...{RESET}")
                # Wait for Atlas to fully drop it before creating the new one
                for _ in range(10):
                    time.sleep(3)
                    remaining = [i for i in collection.list_search_indexes() if i.get("name") == INDEX_NAME]
                    if not remaining:
                        print(f"  {GREEN}✓ Índice eliminado confirmado.{RESET}")
                        return True
                print(f"  {YELLOW}⚠  El índice puede tardar un poco más en eliminarse. Continuando...{RESET}")
                return True
        print(f"  {YELLOW}⚠  No existía índice '{INDEX_NAME}' que eliminar.{RESET}")
        return True
    except Exception as e:
        print(f"  {RED}✗ Error al eliminar: {e}{RESET}")
        return False

def create_search_index(collection):
    banner("Creando Índice Atlas Search con NGram Analyzer", color=GREEN)
    try:
        try:
            model = SearchIndexModel(
                definition=ATLAS_SEARCH_INDEX_DEFINITION["definition"],
                name=ATLAS_SEARCH_INDEX_DEFINITION["name"],
                type="search"
            )
        except TypeError:
            model = SearchIndexModel(
                definition=ATLAS_SEARCH_INDEX_DEFINITION["definition"],
                name=ATLAS_SEARCH_INDEX_DEFINITION["name"]
            )

        result = collection.create_search_index(model)
        print(f"  {GREEN}✓ Índice '{result}' creado.{RESET}")
        print(f"  {CYAN}  ⏳ Estado: BUILDING. Espera ~30-60s para que pase a READY.{RESET}")
        print(f"\n  {BOLD}Analizadores:{RESET}")
        print(f"    {CYAN}↳{RESET} ngram_code_index      (indexación: substrings min=2 max=15 + lowercase)")
        print(f"    {CYAN}↳{RESET} keyword_lowercase_search (búsqueda: keyword + lowercase)")
        print(f"\n  {BOLD}Campos indexados:{RESET}")
        for field in ATLAS_SEARCH_INDEX_DEFINITION["definition"]["mappings"]["fields"]:
            print(f"    {CYAN}↳{RESET} {field}")
        print(f"\n  {BOLD}Comportamiento esperado tras READY:{RESET}")
        print(f"    {GREEN}→{RESET} Buscar '6004'     → encuentra 'WA6004'")
        print(f"    {GREEN}→{RESET} Buscar 'WA60'     → encuentra 'WA6004', 'WA6014'...")
        print(f"    {GREEN}→{RESET} Buscar 'WA6004'   → encuentra 'WA6004' con score máximo")
        print(f"    {GREEN}→{RESET} Buscar '90915'    → encuentra equivalencias OEM Toyota")
    except Exception as e:
        print(f"  {RED}✗ Error al crear: {e}{RESET}")

def main():
    args     = sys.argv[1:]
    do_list  = "--rebuild" not in args or "--list" in args
    do_build = "--rebuild" in args

    banner("DIROGSA — Gestión de Índices Atlas Search", color=CYAN)
    print(f"  Cluster       : {CYAN}erpCluster (Atlas){RESET}")
    print(f"  Base de datos : {CYAN}{DB_NAME}{RESET}")

    try:
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=10000)
        client.server_info()
        print(f"  {GREEN}✓ Conexión establecida.{RESET}")
    except Exception as e:
        print(f"  {RED}✗ No se pudo conectar: {e}{RESET}")
        sys.exit(1)

    db = client[DB_NAME]
    collection, collection_name = find_products_collection(db)

    if collection is None:
        print(f"\n  {RED}✗ Colección no encontrada. Disponibles: {db.list_collection_names()}{RESET}")
        client.close()
        sys.exit(1)

    print(f"  Colección     : {CYAN}{collection_name}{RESET}")
    print(f"  Documentos    : {CYAN}{collection.count_documents({})}{RESET}")

    if do_build:
        banner("Reconstruyendo Índice Atlas Search", color=YELLOW)
        if drop_search_index(collection):
            create_search_index(collection)

    if do_list:
        list_all_indexes(collection, collection_name)

    client.close()
    print(f"\n{GREEN}{BOLD}✓ Completado.{RESET}\n")

if __name__ == "__main__":
    main()
