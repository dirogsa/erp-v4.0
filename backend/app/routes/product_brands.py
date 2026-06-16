from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import List, Optional
from ..models.inventory import ProductBrand, Product
from app.routes.auth import get_current_user
from app.models.auth import User, UserRole

router = APIRouter(prefix="/product-brands", tags=["Product Brands"])

DEFAULT_BRAND_PROFILES = {
    "WIX": {
        "origin": "Estados Unidos / Europa",
        "description": "Líder mundial en filtración automotriz y pesada con tecnología Spin-On de alta durabilidad."
    },
    "MANN": {
        "origin": "Alemania",
        "description": "Equipos originales y filtración de alta gama para vehículos comerciales y europeos."
    },
    "MANN-FILTER": {
        "origin": "Alemania",
        "description": "Equipos originales y filtración de alta gama para vehículos comerciales y europeos."
    },
    "AZUMI": {
        "origin": "Japón",
        "description": "Filtración de precisión de estándar OEM optimizada para el parque automotor japonés y coreano."
    },
    "TOTACHI": {
        "origin": "Japón",
        "description": "Soluciones integrales de lubricación y filtración industrial de alta tecnología."
    },
    "ASAKASHI": {
        "origin": "Japón",
        "description": "Filtros de calidad de equipo original para automóviles, maquinaria y camiones."
    },
    "MAHLE": {
        "origin": "Alemania / Europa",
        "description": "Socio de desarrollo internacional y proveedor líder del sector de la automoción."
    },
    "FILTRON": {
        "origin": "Polonia / Europa",
        "description": "Filtros de calidad OEM para turismos y furgonetas, parte de la red de filtración global."
    },
    "FILTROW": {
        "origin": "Asia",
        "description": "Línea de repuestos y filtros de calidad superior marca FILTROW con garantía certificada de DIROGSA."
    },
    "GENERICO": {
        "origin": "",
        "description": "Línea de repuestos y filtros de calidad superior marca GENERICO con garantía certificada de DIROGSA."
    },
    "GENERIC": {
        "origin": "",
        "description": "Línea de repuestos y filtros de calidad superior marca GENERICO con garantía certificada de DIROGSA."
    },
    "LYS": {
        "origin": "Asia",
        "description": "Línea de repuestos y filtros de calidad superior marca LYS con garantía certificada de DIROGSA."
    },
    "OEM": {
        "origin": "",
        "description": "Línea de repuestos y filtros de calidad superior marca OEM con garantía certificada de DIROGSA."
    }
}

async def perform_full_product_brand_sync():
    """Extracts unique brands from products (main brand and equivalences) and upserts them into ProductBrand collection."""
    # Get distinct brands from products main brand
    main_brands = await Product.distinct("brand")
    
    # Get distinct brands from equivalences
    equivalence_brands = await Product.distinct("equivalences.brand")
    
    # Merge and normalize
    all_brands = set()
    for b in main_brands + equivalence_brands:
        if b:
            b_clean = b.strip()
            if b_clean and b_clean.upper() != "N/A":
                all_brands.add(b_clean)
                
    # Also ensure standard brands are included
    for std_brand in DEFAULT_BRAND_PROFILES.keys():
        all_brands.add(std_brand)
                
    for brand_name in sorted(all_brands):
        existing = await ProductBrand.find_one(ProductBrand.name == brand_name)
        profile = DEFAULT_BRAND_PROFILES.get(brand_name.upper()) or {}
        
        if not existing:
            new_brand = ProductBrand(
                name=brand_name,
                origin=profile.get("origin", "Importado"),
                description=profile.get("description", f"Línea de repuestos y filtros de calidad superior marca {brand_name}.")
            )
            await new_brand.save()
        else:
            # Update origin/description if not set or if it's default
            dirty = False
            if not existing.origin or existing.origin == "Importado":
                existing.origin = profile.get("origin", "Importado")
                dirty = True
            if not existing.description and "description" in profile:
                existing.description = profile.get("description")
                dirty = True
            if dirty:
                await existing.save()

@router.get("/", response_model=List[ProductBrand])
async def get_product_brands():
    return await ProductBrand.find({}).sort([("name", 1)]).to_list()

@router.post("/sync")
async def sync_product_brands(background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")

    background_tasks.add_task(perform_full_product_brand_sync)
    return {"message": "Sincronización iniciada", "status": "processing"}

@router.patch("/bulk")
async def bulk_update_product_brands(
    brand_names: List[str], 
    update_data: dict, 
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    allowed_fields = ["is_active", "show_in_catalog", "origin", "description", "logo_url", "theme_color"]
    filtered_update = {k: v for k, v in update_data.items() if k in allowed_fields}
    
    if not filtered_update:
        return {"message": "No valid fields to update"}

    await ProductBrand.get_motor_collection().update_many(
        {"name": {"$in": brand_names}},
        {"$set": filtered_update}
    )
    return {"message": f"Updated {len(brand_names)} brands"}

@router.put("/{name:path}")
async def update_product_brand(name: str, brand_data: ProductBrand, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    brand = await ProductBrand.find_one(ProductBrand.name == name)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
        
    brand.is_active = brand_data.is_active
    brand.show_in_catalog = brand_data.show_in_catalog
    brand.origin = brand_data.origin
    brand.description = brand_data.description
    brand.logo_url = brand_data.logo_url
    brand.theme_color = brand_data.theme_color
    await brand.save()
    return brand
