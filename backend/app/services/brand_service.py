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

        sync_status["last_result"] = f"Sincronización Exitosa: {len(results)} marcas protegidas."
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
