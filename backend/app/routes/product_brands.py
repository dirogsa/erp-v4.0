from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import List, Optional
from pydantic import BaseModel
from ..models.inventory import ProductBrand, Product
from app.routes.auth import get_current_user
from app.models.auth import User, UserRole
from app.utils.slug_utils import to_slug

router = APIRouter(prefix="/product-brands", tags=["Product Brands"])

# ─── Seed data for featured brands ────────────────────────────────────────────
# This is ONLY used on first-time sync. Once brands are in DB, edit them via ERP UI.
FEATURED_BRAND_DEFAULTS = {
    "WIX": {
        "origin": "USA 🇺🇸",
        "tagline": "La marca #1 en filtración",
        "description": "WIX Filters es la marca de filtros más vendida en Estados Unidos, con más de 80 años de experiencia. Tecnología Spin-On de alta durabilidad para todo tipo de motor.",
        "theme_color": "#F59E0B",
        "is_featured": True,
        "show_in_brand_hub": True,
        "marketing_bullets": ["Más de 80 años de experiencia", "Tecnología Spin-On premium", "Stock permanente en Lima"],
    },
    "FILTRON": {
        "origin": "Polonia 🇵🇱 / Europa",
        "tagline": "Calidad OEM europea",
        "description": "FILTRON es una de las marcas líderes de filtración en Europa, con cobertura para vehículos de pasajeros y comerciales de todas las marcas.",
        "theme_color": "#EF4444",
        "is_featured": True,
        "show_in_brand_hub": True,
        "marketing_bullets": ["Calidad de equipo original", "Amplia cobertura europea", "Compatible con marcas asiáticas"],
    },
    "AZUMI": {
        "origin": "Japón 🇯🇵",
        "tagline": "Precisión japonesa para Latinoamérica",
        "description": "AZUMI es una marca japonesa especializada en el mercado latinoamericano. Excelente relación precio-calidad con tecnología de filtración de estándar OEM.",
        "theme_color": "#10B981",
        "is_featured": True,
        "show_in_brand_hub": True,
        "marketing_bullets": ["Diseñado para autos japoneses y coreanos", "Precio competitivo mayorista", "Alta rotación en el mercado"],
    },
    "TOTACHI": {
        "origin": "Japón 🇯🇵",
        "tagline": "Lubricantes y filtros premium",
        "description": "TOTACHI es una marca premium japonesa reconocida por su tecnología de lubricantes y filtros de alta performance para motores modernos.",
        "theme_color": "#8B5CF6",
        "is_featured": True,
        "show_in_brand_hub": True,
        "marketing_bullets": ["Tecnología japonesa premium", "Alta performance para motores modernos", "Certificación internacional"],
    },
    "ASAKASHI": {
        "origin": "Japón 🇯🇵",
        "tagline": "Calidad OEM para flotas asiáticas",
        "description": "JS Asakashi es un fabricante japonés de filtros de calidad de equipo original, con cobertura extensa para automóviles, camionetas y maquinaria de marcas japonesas.",
        "theme_color": "#F97316",
        "is_featured": True,
        "show_in_brand_hub": True,
        "marketing_bullets": ["Equipo original japonés", "Cobertura Toyota, Nissan, Honda", "Ideal para flotas de trabajo"],
    },
}


async def perform_full_product_brand_sync():
    """
    Extracts unique brands from products and equivalences, upserts them into ProductBrand.
    Featured brand metadata is seeded on first creation only — subsequent edits via ERP UI are preserved.
    """
    main_brands = await Product.distinct("brand")
    equivalence_brands = await Product.distinct("equivalences.brand")

    all_brands = set()
    for b in main_brands + equivalence_brands:
        if b:
            b_clean = b.strip()
            if b_clean and b_clean.upper() not in ("N/A", ""):
                all_brands.add(b_clean)

    for brand_name in sorted(all_brands):
        existing = await ProductBrand.find_one(ProductBrand.name == brand_name)
        profile = FEATURED_BRAND_DEFAULTS.get(brand_name.upper(), {})

        if not existing:
            new_brand = ProductBrand(
                name=brand_name,
                origin=profile.get("origin", "Importado"),
                description=profile.get("description"),
                tagline=profile.get("tagline"),
                theme_color=profile.get("theme_color"),
                marketing_bullets=profile.get("marketing_bullets", []),
                is_featured=profile.get("is_featured", False),
                show_in_brand_hub=profile.get("show_in_brand_hub", False),
                show_in_catalog=brand_name.upper() in FEATURED_BRAND_DEFAULTS,
            )
            await new_brand.save()
        else:
            # Preserve manual edits — only fill empty fields from defaults
            dirty = False
            if profile:
                if not existing.origin or existing.origin == "Importado":
                    existing.origin = profile.get("origin", "Importado"); dirty = True
                if not existing.description:
                    existing.description = profile.get("description"); dirty = True
                if not existing.tagline:
                    existing.tagline = profile.get("tagline"); dirty = True
                if not existing.theme_color:
                    existing.theme_color = profile.get("theme_color"); dirty = True
                if not existing.marketing_bullets:
                    existing.marketing_bullets = profile.get("marketing_bullets", []); dirty = True
                # is_featured / show_in_brand_hub: only set to True, never force-reset existing True
                if not existing.is_featured and profile.get("is_featured"):
                    existing.is_featured = True; dirty = True
                if not existing.show_in_brand_hub and profile.get("show_in_brand_hub"):
                    existing.show_in_brand_hub = True; dirty = True
            if dirty:
                await existing.save()


class BrandUpdateSchema(BaseModel):
    """Strict schema for brand updates — prevents mass-assignment attacks."""
    is_active: Optional[bool] = None
    show_in_catalog: Optional[bool] = None
    is_featured: Optional[bool] = None
    show_in_brand_hub: Optional[bool] = None
    origin: Optional[str] = None
    description: Optional[str] = None
    tagline: Optional[str] = None
    theme_color: Optional[str] = None
    marketing_bullets: Optional[List[str]] = None
    logo_public_id: Optional[str] = None


@router.get("", response_model=List[ProductBrand])
async def get_product_brands():
    return await ProductBrand.find({}).sort([("name", 1)]).to_list()


@router.post("/sync")
async def sync_product_brands(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
    background_tasks.add_task(perform_full_product_brand_sync)
    return {"message": "Sincronización iniciada", "status": "processing"}


@router.put("/{name:path}")
async def update_product_brand(
    name: str,
    data: BrandUpdateSchema,
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")

    brand = await ProductBrand.find_one(ProductBrand.name == name)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    update = data.model_dump(exclude_unset=True)
    for field, value in update.items():
        setattr(brand, field, value)

    await brand.save()
    return brand


@router.patch("/bulk")
async def bulk_update_product_brands(
    brand_names: List[str],
    update_data: dict,
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")

    allowed = {"is_active", "show_in_catalog", "is_featured", "show_in_brand_hub",
               "origin", "description", "tagline", "theme_color", "logo_public_id"}
    filtered = {k: v for k, v in update_data.items() if k in allowed}

    if not filtered:
        return {"message": "No valid fields to update"}

    await ProductBrand.get_motor_collection().update_many(
        {"name": {"$in": brand_names}},
        {"$set": filtered}
    )
    return {"message": f"Updated {len(brand_names)} brands"}
