from typing import List, Optional
from ..models.inventory import VehicleBrand, BrandOrigin, Product
import pymongo
import asyncio
import re
import unicodedata

# Estado global para seguimiento
sync_status = {
    "is_running": False,
    "progress": 0,
    "total": 0,
    "current_step": "Inactivo",
    "last_result": None
}

def normalize_text(text: str) -> str:
    """Normalización extrema: Mayúsculas, sin acentos, sin espacios extra"""
    if not text: return ""
    # Quitar acentos
    text = "".join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn')
    return text.upper().strip()

def calculate_similarity(s1, s2):
    s1, s2 = normalize_text(s1), normalize_text(s2)
    if s1 == s2: return 1.0
    if not s1 or not s2: return 0.0
    
    c1 = {}
    for char in s1: c1[char] = c1.get(char, 0) + 1
    c2 = {}
    for char in s2: c2[char] = c2.get(char, 0) + 1
    
    matches = 0
    for char, count in c1.items():
        if char in c2:
            matches += min(count, c2[char])
            
    return matches / max(len(s1), len(s2))

async def get_sync_status():
    return sync_status

async def perform_full_brand_sync():
    """
    Motor de sincronización con Resiliencia de Base de Datos y Limpieza de Basura.
    """
    global sync_status
    if sync_status["is_running"]: return
        
    sync_status["is_running"] = True
    sync_status["progress"] = 0
    sync_status["current_step"] = "Escaneando productos..."
    
    try:
        # 1. Agregación (Normalizando y Limpiando)
        pipeline = [
            {"$match": {"applications": {"$exists": True, "$not": {"$size": 0}}}},
            {"$unwind": "$applications"},
            {"$group": {
                "_id": {"$trim": {"input": {"$toUpper": "$applications.make"}}},
                "models": {"$addToSet": {"$trim": {"input": {"$toUpper": "$applications.model"}}}}
            }},
            {"$match": {
                "_id": {
                    "$ne": None, 
                    "$regex": "^(?!VEH[IÍ]CULOS|APLICACIONES|MARCA|MAKE).*$", # Ignorar cabeceras de basura
                    "$options": "i"
                }
            }},
        ]
        
        results = await Product.get_motor_collection().aggregate(pipeline).to_list(length=None)
        sync_status["total"] = len(results)
        
        # 2. Cargar marcas actuales con normalización de claves para evitar duplicados
        current_brands = await VehicleBrand.find_all().to_list()
        brand_map = {normalize_text(b.name): b for b in current_brands}
        
        # 3. Paso de Ingesta con lógica de Upsert Segura
        for i, res in enumerate(results):
            raw_name = res["_id"]
            norm_name = normalize_text(raw_name)
            model_list = sorted([str(m).strip().upper() for m in res["models"] if m and str(m).strip()])
            
            brand = brand_map.get(norm_name)
            
            try:
                if brand:
                    # Actualizar existente
                    if set(brand.models) != set(model_list):
                        await VehicleBrand.get_motor_collection().update_one(
                            {"_id": brand.id},
                            {"$set": {"models": model_list}}
                        )
                else:
                    # Crear nuevo usando update_one con upsert para evitar errores de llave duplicada
                    await VehicleBrand.get_motor_collection().update_one(
                        {"name": raw_name},
                        {"$setOnInsert": {
                            "name": raw_name,
                            "origin": BrandOrigin.OTHER,
                            "models": model_list,
                            "is_active": False, # Por defecto oculto para limpieza
                            "is_popular": False
                        }},
                        upsert=True
                    )
                    # Recargar para el mapa
                    brand_map[norm_name] = await VehicleBrand.find_one({"name": raw_name})
            except Exception as e:
                print(f"[SYNC ERROR] Falló procesar {raw_name}: {str(e)}")
            
            if i % 10 == 0:
                sync_status["progress"] = i
                sync_status["current_step"] = f"Validando: {raw_name}"

        # 4. NORMALIZACIÓN AGRESIVA Y FUSIÓN DE TYPOS
        sync_status["current_step"] = "Ejecutando limpieza jerárquica..."
        all_names = sorted(brand_map.keys(), key=len)
        
        for i, child_norm in enumerate(all_names):
            if len(child_norm) < 3: continue
            
            best_parent_name = None # Nombre real del padre
            
            for j in range(i):
                parent_norm = all_names[j]
                if len(parent_norm) < 3: continue
                
                # REGLA 1: Jerarquía léxica
                if child_norm.startswith(parent_norm) or f" {parent_norm} " in f" {child_norm} ":
                    if len(child_norm) > len(parent_norm):
                        best_parent_name = brand_map[parent_norm].name
                        break
                
                # REGLA 2: Similitud Difusa
                similarity = calculate_similarity(child_norm, parent_norm)
                if similarity > 0.88:
                    parent_brand = brand_map[parent_norm]
                    if parent_brand.is_popular or len(parent_norm) <= len(child_norm):
                        best_parent_name = parent_brand.name
                        break
            
            if best_parent_name:
                brand = brand_map[child_norm]
                if brand.parent_name != best_parent_name:
                    await VehicleBrand.get_motor_collection().update_one(
                        {"_id": brand.id},
                        {"$set": {"parent_name": best_parent_name}}
                    )

        # --- ENTERPRISE PRODUCT BRANDS SYNCHRONIZATION (High-Performance MDM Sync) ---
        sync_status["current_step"] = "Sincronizando marcas de productos del catálogo..."
        from app.models.inventory import ProductBrand
        import json
        import os
        
        # 1. Extraer marcas de repuestos/autopartes únicas del catálogo de productos
        collection = Product.get_motor_collection()
        db_brands = await collection.distinct("brand")
        unique_product_brands = set(b.strip().upper() for b in db_brands if b)
        
        # 2. Registrar en la base de datos (colección product_brands) sin sobrescribir los alias manuales
        for pb_name in unique_product_brands:
            await ProductBrand.get_motor_collection().update_one(
                {"name": pb_name},
                {"$setOnInsert": {
                    "name": pb_name,
                    "aliases": [pb_name],
                    "is_active": True
                }},
                upsert=True
            )
            
        # 3. Re-escribir el caché local persistentemente (product_brands.json)
        active_brands = await ProductBrand.find(ProductBrand.is_active == True).to_list()
        new_cache = {}
        for b in active_brands:
            aliases_set = set(a.upper().strip() for a in b.aliases if a)
            aliases_set.add(b.name.upper().strip())
            new_cache[b.name.upper()] = list(aliases_set)
            
        # Actualizar e inicializar en caliente los módulos
        from app.utils.norm_utils import CACHE_FILE_PATH
        os.makedirs(os.path.dirname(CACHE_FILE_PATH), exist_ok=True)
        with open(CACHE_FILE_PATH, "w", encoding="utf-8") as f:
            json.dump(new_cache, f, ensure_ascii=False, indent=4)
            
        # Actualizar las variables globales del módulo norm_utils para impacto inmediato en caliente
        import app.utils.norm_utils as nu
        nu._BRANDS_CACHE = new_cache
        nu._IS_CACHE_LOADED = True

        # --- PRODUCT COUNT PER VEHICLE BRAND (Pre-aggregation for Free Tier) ---
        # Run once per sync. Zero cost at query time — data is stored in the brand document.
        sync_status["current_step"] = "Calculando conteo de productos por marca vehicular..."
        count_pipeline = [
            {"$match": {"is_active_in_shop": True, "applications": {"$exists": True, "$not": {"$size": 0}}}},
            {"$unwind": "$applications"},
            {"$group": {
                "_id": {"$trim": {"input": {"$toUpper": "$applications.make"}}},
                "count": {"$sum": 1}
            }}
        ]
        count_results = await Product.get_motor_collection().aggregate(count_pipeline).to_list(length=None)
        count_map = {r["_id"]: r["count"] for r in count_results if r["_id"]}
        
        # Bulk write: update product_count on each VehicleBrand document
        if count_map:
            bulk_ops = [
                pymongo.UpdateOne(
                    {"name": brand_name},
                    {"$set": {"product_count": count}},
                    upsert=False
                )
                for brand_name, count in count_map.items()
            ]
            # Also zero-out brands not present in this sync (no compatible products)
            await VehicleBrand.get_motor_collection().update_many(
                {"name": {"$nin": list(count_map.keys())}},
                {"$set": {"product_count": 0}}
            )
            await VehicleBrand.get_motor_collection().bulk_write(bulk_ops, ordered=False)

        sync_status["last_result"] = f"Sincronización Exitosa: {len(results)} marcas vehiculares, {len(new_cache)} marcas de productos y conteos actualizados."
    except Exception as e:
        sync_status["last_result"] = f"Error Crítico: {str(e)}"
        print(f"[SYNC CRITICAL ERROR] {str(e)}")
    finally:
        sync_status["is_running"] = False
        sync_status["current_step"] = "Finalizado"

async def ensure_brands_exist(makes: List[str]):
    for m in makes:
        if m and m.strip():
            await VehicleBrand.get_motor_collection().update_one(
                {"name": m.strip().upper()},
                {"$setOnInsert": {"name": m.strip().upper(), "origin": BrandOrigin.OTHER, "models": []}},
                upsert=True
            )
