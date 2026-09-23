from typing import List, Dict, Any
import re
from app.models.inventory import Product, TechnicalSpec, MeasureType, CrossReference, Application
from app.models.dims_reference import DimsReferenceProduct
from app.utils.normalization import clean_code
from fastapi import HTTPException
import logging
from pymongo import UpdateOne

logger = logging.getLogger(__name__)

class DIMSService:
    @staticmethod
    async def import_batch(products_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Procesa un lote de productos (formato JSON de la industria) y los inserta/actualiza en la base de datos.
        """
        imported_count = 0
        updated_count = 0
        errors = []
        bulk_ops = []
        processed_items = []

        for item_data in products_data:
            try:
                if 'product' in item_data:
                    # Formato anidado
                    data = item_data['product']
                else:
                    data = item_data
                
                sku = data.get('item_code')
                if not sku:
                    errors.append("Falta item_code en uno de los productos.")
                    continue

                name = data.get('name', 'Sin Nombre')
                brand = data.get('pref', 'GENERIC')

                # Extraer dimensiones (tc_infos -> en) o (info)
                specs = []
                tc_infos = data.get('tc_infos', {})
                en_specs = tc_infos.get('en', [])
                if not en_specs and 'info' in data:
                    en_specs = data['info']

                for spec_data in en_specs:
                    label = spec_data.get('name', '')
                    value = str(spec_data.get('value') or spec_data.get('code', ''))
                    if label and value:
                        # Inferir MeasureType basado en el label
                        measure_type = MeasureType.MM if 'mm' in label.lower() else MeasureType.OTHER
                        # El label técnico interno (ej. "Outer Diameter [mm]" -> "A") podría ser parseado aquí, 
                        # pero por ahora guardamos el original y el motor DIMS lo normalizará.
                        specs.append(TechnicalSpec(
                            label=label,
                            display_label=label,
                            measure_type=measure_type,
                            value=value
                        ))

                # Extraer Equivalencias Directas (oems y refs)
                equivalences = []
                for oem in data.get('oems', []):
                    equivalences.append(CrossReference(
                        brand=oem.get('brand', 'OEM'),
                        code=oem.get('code', ''),
                        is_original=True
                    ))
                
                for ref in data.get('refs', []):
                    equivalences.append(CrossReference(
                        brand=ref.get('brand', 'REF'),
                        code=ref.get('code', ''),
                        is_original=False
                    ))

                # Extraer Aplicaciones (Vehículos)
                applications = []
                for app in data.get('car_model_types', []):
                    brand_info = app.get('brand', {})
                    model_info = app.get('model', {})
                    applications.append(Application(
                        make=brand_info.get('title', ''),
                        model=model_info.get('name', ''),
                        year=app.get('date_start', '')[:4] if app.get('date_start') else '',
                        engine=app.get('name', '')
                    ))

                # Categoría Inferida
                category_name = "FILTRO DE AIRE" if data.get('is_filter') and 'air' in name.lower() else "OTROS"

                # Crear la instancia del modelo para validación y auto-generación de defaults
                p_data = DimsReferenceProduct(
                    sku=sku,
                    name=name,
                    brand=brand,
                    specs=specs,
                    equivalences=equivalences,
                    applications=applications,
                    category_name=category_name,
                    source="BATCH_IMPORT"
                )

                # Forzar el hook de normalización manualmente ya que bulk_write lo ignora
                p_data.pre_save()

                product_dict = p_data.model_dump(exclude={"id"})

                # Para DimsReferenceProduct no necesitamos proteger campos de inventario
                update_data = {k: v for k, v in product_dict.items() if k != "created_at"}
                insert_only_data = {"created_at": product_dict.get("created_at")}

                bulk_ops.append(
                    UpdateOne(
                        {"sku": sku, "brand": brand},
                        {
                            "$set": update_data,
                            "$setOnInsert": insert_only_data
                        },
                        upsert=True
                    )
                )

                # Registro para feedback de auditoría y trazabilidad visual en el cliente
                processed_items.append({
                    "sku": sku,
                    "brand": brand,
                    "name": name,
                    "equivalences_count": len(equivalences),
                    "specs_count": len(specs),
                    "applications_count": len(applications)
                })

            except Exception as e:
                logger.error(f"Error procesando sku {data.get('item_code')}: {str(e)}")
                errors.append(f"Error en {data.get('item_code')}: {str(e)}")

        CHUNK_SIZE = 1000
        if bulk_ops:
            collection = Product.get_motor_collection()
            for i in range(0, len(bulk_ops), CHUNK_SIZE):
                chunk = bulk_ops[i:i + CHUNK_SIZE]
                try:
                    result = await collection.bulk_write(chunk, ordered=False)
                    imported_count += result.upserted_count
                    updated_count += result.modified_count
                except Exception as e:
                    logger.error(f"Error en bulk_write chunk {i//CHUNK_SIZE}: {str(e)}")
                    errors.append(f"Fallo en lote {i//CHUNK_SIZE + 1}: {str(e)}")

        return {
            "status": "success",
            "imported": imported_count,
            "updated": updated_count,
            "total_processed": len(processed_items),
            "items": processed_items,
            "errors": errors
        }

    @staticmethod
    async def get_direct_equivalencies(sku: str) -> Dict[str, Any]:
        """
        Algoritmo 3: Encuentra equivalencias directas basadas puramente en cruces OEM y Aftermarket (refs).
        Implementa búsqueda bidireccional de 360 grados usando clean_code.
        """
        # 1. Normalizar el SKU origen
        source_clean_sku = clean_code(sku)
        
        # Búsqueda robusta del producto origen (insensible a mayúsculas o separadores)
        source_product = await DimsReferenceProduct.find_one({
            "$or": [
                {"clean_sku": source_clean_sku},
                {"sku": {"$regex": f"^{re.escape(sku.strip())}$", "$options": "i"}}
            ]
        })
        
        if not source_product:
            # Si no existe como producto cabecera, buscamos si este código aparece como equivalencia en algún producto
            referencing_products = await DimsReferenceProduct.find({
                "$or": [
                    {"equivalences.clean_code": source_clean_sku},
                    {"equivalences.code": {"$regex": f"^{re.escape(sku.strip())}$", "$options": "i"}}
                ]
            }).to_list()
            
            if not referencing_products:
                return {
                    "status": "success",
                    "source_sku": sku,
                    "total_matches": 0,
                    "message": f"El código '{sku}' no existe en el catálogo ni está referenciado en ninguna equivalencia.",
                    "equivalencies": []
                }
            
            # Formatear resultados encontrados a partir del código referenciado
            results = []
            for cand in referencing_products:
                results.append({
                    "sku": cand.sku,
                    "brand": cand.brand,
                    "name": cand.name,
                    "category": cand.category_name,
                    "imageUrl": None,
                    "shared_codes": [sku.strip().upper()],
                    "match_type": "Direct Reference Match (Found in Equivalences)"
                })
            return {
                "status": "success",
                "source_sku": sku,
                "total_matches": len(results),
                "equivalencies": results
            }

        # 2. Extraer los códigos limpios de referencia del producto origen
        ref_codes = [e.clean_code for e in source_product.equivalences if e.clean_code]
        
        # Agregamos el propio SKU limpio a la lista de códigos a buscar
        search_codes = ref_codes + [source_clean_sku]
        
        if not search_codes:
            return {
                "status": "success",
                "source_sku": sku,
                "message": "El producto no tiene referencias (OEM/Ref) registradas.",
                "equivalencies": []
            }

        # 3. Buscar productos (excluyendo el origen) que:
        # a) Compartan alguna equivalencia nuestra en sus propias equivalencias
        # b) Su SKU sea uno de nuestros códigos de equivalencia
        # c) Nos mencionen a nosotros (nuestro SKU) en sus equivalencias (Bidireccionalidad)
        query = {
            "sku": {"$ne": sku},
            "$or": [
                {"equivalences.clean_code": {"$in": search_codes}},
                {"clean_sku": {"$in": search_codes}},
                # En caso de que no tengan clean_sku guardado todavía (compatibilidad retroactiva)
                {"sku": {"$in": ref_codes}}
            ]
        }

        candidates = await DimsReferenceProduct.find(query).to_list()
        
        # 4. Formatear la respuesta
        results = []
        for cand in candidates:
            # Identificar por qué coinciden
            cand_ref_codes = [e.clean_code for e in cand.equivalences if e.clean_code]
            cand_clean_sku = cand.clean_sku or clean_code(cand.sku)
            cand_all_codes = cand_ref_codes + [cand_clean_sku]
            
            shared_codes = list(set(search_codes) & set(cand_all_codes))
            
            results.append({
                "sku": cand.sku,
                "brand": cand.brand,
                "name": cand.name,
                "category": cand.category_name,
                "imageUrl": cand.image_url,
                "shared_codes": shared_codes,
                "match_type": "OEM/Direct Ref Match (Bidirectional)"
            })

        return {
            "status": "success",
            "source_sku": sku,
            "total_matches": len(results),
            "equivalencies": results
        }

    @staticmethod
    async def get_reference_products(
        page: int = 1,
        limit: int = 50,
        search: str = "",
        brand: str = ""
    ) -> Dict[str, Any]:
        """
        Retorna la lista paginada de productos de referencia / catálogo relacional (DIMS).
        """
        query: Dict[str, Any] = {}
        
        if brand:
            query["brand"] = brand.strip().upper()
            
        if search and search.strip():
            s = search.strip()
            clean_s = clean_code(s)
            query["$or"] = [
                {"sku": {"$regex": re.escape(s), "$options": "i"}},
                {"clean_sku": {"$regex": re.escape(clean_s), "$options": "i"}},
                {"name": {"$regex": re.escape(s), "$options": "i"}},
                {"equivalences.clean_code": {"$regex": re.escape(clean_s), "$options": "i"}},
                {"equivalences.code": {"$regex": re.escape(s), "$options": "i"}}
            ]
            
        total = await DimsReferenceProduct.find(query).count()
        skip = (page - 1) * limit
        
        cursor = DimsReferenceProduct.get_motor_collection().find(query, {
            "sku": 1, "brand": 1, "name": 1, "category_name": 1,
            "specs": 1, "equivalences": 1, "applications": 1, "created_at": 1
        }).sort([("created_at", -1), ("sku", 1)]).skip(skip).limit(limit)
        
        db_items = await cursor.to_list(length=limit)
        
        items = []
        for item in db_items:
            items.append({
                "id": str(item.get("_id")),
                "sku": item.get("sku"),
                "brand": item.get("brand", "GENERIC"),
                "name": item.get("name", ""),
                "category_name": item.get("category_name", "OTROS"),
                "equivalences_count": len(item.get("equivalences", [])),
                "specs_count": len(item.get("specs", [])),
                "applications_count": len(item.get("applications", [])),
                "equivalences_sample": [e.get("code") for e in item.get("equivalences", [])[:5] if isinstance(e, dict)],
                "created_at": item.get("created_at")
            })
            
        return {
            "items": items,
            "total": total,
            "page": page,
            "pages": (total // limit) + (1 if total % limit > 0 else 0),
            "size": limit
        }
