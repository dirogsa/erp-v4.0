from typing import List, Dict, Any
from app.models.inventory import Product, TechnicalSpec, MeasureType, CrossReference, Application, ProductType
from fastapi import HTTPException
import logging

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

                # Upsert en Beanie (Product)
                existing_product = await Product.find_one({"sku": sku})
                if existing_product:
                    existing_product.name = name
                    existing_product.brand = brand
                    existing_product.specs = specs
                    existing_product.equivalences = equivalences
                    existing_product.applications = applications
                    existing_product.category_name = category_name
                    await existing_product.save()
                    updated_count += 1
                else:
                    new_product = Product(
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
                    await new_product.insert()
                    imported_count += 1

            except Exception as e:
                logger.error(f"Error procesando sku {data.get('item_code')}: {str(e)}")
                errors.append(f"Error en {data.get('item_code')}: {str(e)}")

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
        No toma en cuenta las dimensiones.
        """
        source_product = await Product.find_one({"sku": sku})
        if not source_product:
            raise ValueError(f"Product {sku} not found")

        # 1. Extraer los códigos de referencia del producto origen
        ref_codes = [e.code for e in source_product.equivalences if e.code]
        if not ref_codes:
            return {
                "status": "success",
                "source_sku": sku,
                "message": "El producto no tiene referencias (OEM/Ref) registradas.",
                "equivalencies": []
            }

        # 2. Buscar otros productos que contengan alguno de estos códigos en sus equivalencias
        # o cuyo SKU coincida con uno de estos códigos
        query = {
            "sku": {"$ne": sku},
            "status": "AVAILABLE",
            "$or": [
                {"equivalences.code": {"$in": ref_codes}},
                {"sku": {"$in": ref_codes}}
            ]
        }

        candidates = await Product.find(query).to_list()
        
        # 3. Formatear la respuesta
        results = []
        for cand in candidates:
            # Identificar por qué coinciden (qué códigos tienen en común)
            cand_ref_codes = [e.code for e in cand.equivalences if e.code] + [cand.sku]
            shared_codes = list(set(ref_codes) & set(cand_ref_codes))
            
            results.append({
                "sku": cand.sku,
                "brand": cand.brand,
                "name": cand.name,
                "category": cand.category_name,
                "imageUrl": cand.image_url,
                "shared_codes": shared_codes,
                "match_type": "OEM/Direct Ref Match"
            })

        return {
            "status": "success",
            "source_sku": sku,
            "total_matches": len(results),
            "equivalencies": results
        }
