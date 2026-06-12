from typing import List, Dict, Any
from app.models.inventory import Product, CrossReference, Application, ProductBrand, TechnicalSpec, MeasureType
import logging

logger = logging.getLogger(__name__)

async def enrich_product_with_tecdoc(product: Product, tecdoc_data: Dict[str, Any]) -> Product:
    """
    Realiza un merge inteligente (acumulativo) de los datos de TecDoc al producto existente.
    """
    data = tecdoc_data.get("product", {}) if "product" in tecdoc_data else tecdoc_data
    
    # 1. Merge OEMs (is_original = True)
    oems = data.get("oems", [])
    for oem in oems:
        brand = str(oem.get("brand", "")).strip().upper()
        code = str(oem.get("code", "")).strip().upper()
        if brand and code:
            # Check if exists
            exists = any(
                e.brand == brand and e.code == code and e.is_original == True 
                for e in product.equivalences
            )
            if not exists:
                product.equivalences.append(CrossReference(brand=brand, code=code, is_original=True))

    # 2. Merge Refs (is_original = False)
    refs = data.get("refs", [])
    for ref in refs:
        brand = str(ref.get("brand", "")).strip().upper()
        code = str(ref.get("code", "")).strip().upper()
        if brand and code:
            # Check if exists
            exists = any(
                e.brand == brand and e.code == code and e.is_original == False 
                for e in product.equivalences
            )
            if not exists:
                product.equivalences.append(CrossReference(brand=brand, code=code, is_original=False))

    # 3. Merge Applications
    car_models = data.get("car_model_types", [])
    for app in car_models:
        make = str(app.get("brand", {}).get("title", "")).strip().upper()
        model = str(app.get("model", {}).get("name", "")).strip().upper()
        engine = str(app.get("name", "")).strip().upper()
        
        # Start and End Date
        start_date = app.get("date_start", "")
        end_date = app.get("date_end", "")
        year_str = ""
        if start_date:
            start_year = start_date.split("-")[0]
            year_str = start_year
            if end_date:
                end_year = end_date.split("-")[0]
                year_str = f"{start_year}-{end_year}"

        if make and model:
            # Simple deduplication based on make + model + engine
            exists = any(
                a.make == make and a.model == model and a.engine == engine
                for a in product.applications
            )
            if not exists:
                product.applications.append(Application(
                    make=make,
                    model=model,
                    year=year_str,
                    engine=engine,
                    notes=app.get("code_engine", "")
                ))

    # 4. Merge Specs
    specs = data.get("info", [])
    if specs and not hasattr(product, "specs"):
        product.specs = []
    
    for spec in specs:
        name = str(spec.get("name", "")).strip()
        val = str(spec.get("code", "")).strip()
        if name and val:
            # Check if exists
            exists = any(s.label == name for s in product.specs)
            if not exists:
                product.specs.append(TechnicalSpec(label=name, measure_type=MeasureType.OTHER, value=val))

    return product

async def sync_product_brands_from_product(product: Product):
    """
    Sincroniza las marcas de repuesto extraidas de las equivalencias de este producto.
    """
    refs = [e.brand for e in product.equivalences if e.is_original == False]
    unique_brands = set(refs)
    
    for brand_name in unique_brands:
        if not brand_name:
            continue
        existing = await ProductBrand.find_one(ProductBrand.name == brand_name)
        if not existing:
            new_brand = ProductBrand(name=brand_name)
            await new_brand.save()
