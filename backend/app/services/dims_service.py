from typing import List, Dict, Any
from app.models.inventory import Product, TechnicalSpec, MeasureType, CrossReference, Application, ProductType
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
                p_data = Product(
                    sku=sku,
                    name=name,
                    brand=brand,
                    type=ProductType.COMMERCIAL,
                    specs=specs,
                    equivalences=equivalences,
                    applications=applications,
                    category_name=category_name,
                    status="AVAILABLE"
                )

                # Forzar el hook de normalización manualmente ya que bulk_write lo ignora
                p_data.pre_save()

                product_dict = p_data.model_dump(exclude={"id"})

                # ESTRATEGIA DE SOBERANÍA DE DATOS (Smart Merge)
                protected_fields = {
                    "stock_current", "stock_reserved", "cost", "company_data", 
                    "loyalty_points", "points_cost", "is_temporary", "created_at"
                }

                update_data = {k: v for k, v in product_dict.items() if k not in protected_fields}
                insert_only_data = {k: v for k, v in product_dict.items() if k in protected_fields}

                bulk_ops.append(
                    UpdateOne(
                        {"sku": sku},
                        {
                            "$set": update_data,
                            "$setOnInsert": insert_only_data
                        },
                        upsert=True
                    )
                )

            except Exception as e:
                logger.error(f"Error procesando sku {data.get('item_code')}: {str(e)}")
                errors.append(f"Error en {data.get('item_code')}: {str(e)}")

        if bulk_ops:
            try:
                collection = Product.get_motor_collection()
                result = await collection.bulk_write(bulk_ops, ordered=False)
                imported_count = result.upserted_count
                updated_count = result.modified_count
            except Exception as e:
                logger.error(f"Error en bulk_write: {str(e)}")
                errors.append(f"Fallo catastrófico en inyección masiva: {str(e)}")

        return {
            "status": "success",
            "imported": imported_count,
            "updated": updated_count,
            "errors": errors
        }

    @staticmethod
    async def get_direct_equivalencies(sku: str) -> Dict[str, Any]:
        """
        Algoritmo 3: Encuentra equivalencias directas basadas puramente en cruces OEM y Aftermarket (refs).
        Implementa búsqueda bidireccional de 360 grados usando clean_code.
        """
        source_product = await Product.find_one({"sku": sku})
        if not source_product:
            raise ValueError(f"Product {sku} not found")

        # 1. Normalizar el SKU origen
        source_clean_sku = clean_code(sku)

        # 2. Extraer los códigos limpios de referencia del producto origen
        ref_codes = [e.clean_code for e in source_product.equivalences if e.clean_code]
        
        # Agregamos el propio SKU limpio a la lista de códigos a buscar
        # para que si otro producto nos menciona en sus equivalencias, lo encontremos
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
            "status": "AVAILABLE",
            "$or": [
                {"equivalences.clean_code": {"$in": search_codes}},
                {"clean_sku": {"$in": search_codes}},
                # En caso de que no tengan clean_sku guardado todavía (compatibilidad retroactiva)
                {"sku": {"$in": ref_codes}}
            ]
        }

        candidates = await Product.find(query).to_list()
        
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
