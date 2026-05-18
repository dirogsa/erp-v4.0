from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel
from app.models.inventory import Product, Warehouse, MovementType, ProductType, ProductStatus
from app.models.auth import User, UserRole
from app.services import inventory_service
from app.schemas.inventory_schemas import LossRegistration, TransferRequest, BulkImportResponse, ProductWithPrice, ProductLeanWithPrice
from app.schemas.common import PaginatedResponse
from .auth import get_current_user, check_role
from app.dependencies.company import get_current_company_id

router = APIRouter(prefix="/inventory", tags=["Inventory"])

# --- Schemas de Visibilidad ---
class VisibilityPayload(BaseModel):
    is_active_in_shop: Optional[bool] = None
    is_new: Optional[bool] = None

class BulkVisibilityPayload(BaseModel):
    is_active_in_shop: Optional[bool] = None
    is_new: Optional[bool] = None
    # Filtros de aplicación (por defecto: solo COMMERCIAL no DISCONTINUED)
    only_with_price: bool = True  # Solo productos con precio_retail > 0
    product_ids: Optional[List[str]] = None # Opcional: Lista de IDs específicos (mongo _id)

@router.get("/products", response_model=PaginatedResponse[ProductLeanWithPrice])
async def get_products(
    skip: int = 0, 
    limit: int = 50, 
    search: Optional[str] = None, 
    category: Optional[str] = None,
    redeemable_only: Optional[bool] = None,
    product_type: Optional[str] = None,
    filter_unrecognized: Optional[bool] = None,
    filter_others: Optional[bool] = None,
    company_id: str = Depends(get_current_company_id)
):
    return await inventory_service.get_products(
        skip, limit, search, category, redeemable_only, product_type, 
        filter_unrecognized=filter_unrecognized,
        filter_others=filter_others,
        company_id=company_id
    )

from beanie import PydanticObjectId
from app.models.inventory import ProductBrand

@router.get("/brands")
async def get_brands(full: bool = False):
    """
    Retorna la lista de marcas. 
    Si full=True, devuelve la lista completa de objetos ProductBrand (catálogo MDM).
    Si full=False (default), devuelve una lista simple de strings con nombres de marcas en inventario.
    """
    if full:
        # Devuelve objetos ProductBrand de MongoDB, ordenados por nombre
        return await ProductBrand.find().sort([("name", 1)]).to_list()
    else:
        # Devuelve nombres únicos de marcas de los productos
        return await inventory_service.get_unique_brands()

@router.post("/brands", response_model=ProductBrand)
async def create_product_brand(
    brand: ProductBrand,
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """
    Registra una nueva marca maestra en el catálogo MDM.
    """
    brand.name = brand.name.strip().upper()
    brand.aliases = [a.strip().upper() for a in brand.aliases if a.strip()]
    
    existing = await ProductBrand.find_one(ProductBrand.name == brand.name)
    if existing:
        raise HTTPException(status_code=400, detail=f"La marca {brand.name} ya existe en el maestro.")
        
    await brand.insert()
    
    # Forzar recarga en caliente del caché local
    from app.utils.norm_utils import _refresh_brands_cache
    await _refresh_brands_cache()
    
    return brand

@router.put("/brands/{id}", response_model=ProductBrand)
async def update_product_brand(
    id: PydanticObjectId,
    brand_data: ProductBrand,
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """
    Actualiza una marca maestra existente en el catálogo MDM.
    """
    brand = await ProductBrand.get(id)
    if not brand:
        raise HTTPException(status_code=404, detail="Marca no encontrada")
        
    brand.name = brand_data.name.strip().upper()
    brand.aliases = [a.strip().upper() for a in brand_data.aliases if a.strip()]
    brand.is_active = brand_data.is_active
    
    await brand.save()
    
    # Forzar recarga en caliente del caché local
    from app.utils.norm_utils import _refresh_brands_cache
    await _refresh_brands_cache()
    
    return brand

@router.delete("/brands/{id}")
async def delete_product_brand(
    id: PydanticObjectId,
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """
    Elimina una marca del catálogo maestro MDM.
    """
    brand = await ProductBrand.get(id)
    if not brand:
        raise HTTPException(status_code=404, detail="Marca no encontrada")
        
    await brand.delete()
    
    # Forzar recarga en caliente del caché local
    from app.utils.norm_utils import _refresh_brands_cache
    await _refresh_brands_cache()
    
    return {"message": "Marca eliminada del catálogo maestro con éxito."}

@router.get("/generate-marketing-sku")
async def generate_marketing_sku(company_id: str = Depends(get_current_company_id)):
    sku = await inventory_service.generate_marketing_sku(company_id=company_id)
    return {"sku": sku}

@router.get("/external-lookup")
async def external_lookup(sku: str):
    """
    Busca en catálogos externos y devuelve el HTML.
    """
    html_content = await inventory_service.external_lookup(sku)
    return {"html": html_content}

@router.get("/smart-search")
async def smart_search(q: str):
    """
    Búsqueda inteligente: local + externa con parseo.
    """
    return await inventory_service.smart_search(q)

@router.post("/products", response_model=Product)
async def create_product(
    product: Product, 
    initial_stock: int = 0,
    current_user: User = Depends(check_role([UserRole.STOCK_MANAGER, UserRole.ADMIN, UserRole.SUPERADMIN])),
    company_id: str = Depends(get_current_company_id)
):
    # En la arquitectura de Catálogo Maestro, la propiedad se maneja en buckets internos
    return await inventory_service.create_product(product, initial_stock, user=current_user, company_id=company_id)

@router.post("/products/bulk", response_model=BulkImportResponse)
async def bulk_create_products(
    products: List[Product],
    update_existing: bool = True,
    current_user: User = Depends(check_role([UserRole.STOCK_MANAGER, UserRole.ADMIN, UserRole.SUPERADMIN])),
    company_id: str = Depends(get_current_company_id)
):
    return await inventory_service.bulk_create_products(products, update_existing=update_existing, user=current_user, company_id=company_id)

@router.put("/products/{sku}", response_model=Product)
async def update_product(
    sku: str, 
    product_data: Product, 
    new_stock: int = None,
    current_user: User = Depends(check_role([UserRole.STOCK_MANAGER, UserRole.ADMIN, UserRole.SUPERADMIN])),
    company_id: str = Depends(get_current_company_id)
):
    product_data.company_id = company_id
    return await inventory_service.update_product(sku, product_data, new_stock, user=current_user)

@router.delete("/products/{sku}")
async def delete_product(
    sku: str,
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    await inventory_service.delete_product(sku, user=current_user)
    return {"message": "Product deleted successfully"}

@router.get("/warehouses", response_model=List[Warehouse])
async def get_warehouses(company_id: str = Depends(get_current_company_id)):
    return await inventory_service.get_warehouses(company_id=company_id)

@router.post("/warehouses", response_model=Warehouse)
async def create_warehouse(warehouse: Warehouse):
    return await inventory_service.create_warehouse(warehouse)

@router.put("/warehouses/{code}", response_model=Warehouse)
async def update_warehouse(code: str, warehouse: Warehouse):
    return await inventory_service.update_warehouse(code, warehouse)

@router.delete("/warehouses/{code}")
async def delete_warehouse(code: str):
    await inventory_service.delete_warehouse(code)
    return {"message": "Warehouse deleted successfully"}


# --- Feature Endpoints ---

@router.post("/losses")
async def register_loss(loss_data: LossRegistration):
    return await inventory_service.register_loss(
        loss_data.sku,
        loss_data.quantity,
        loss_data.loss_type,
        loss_data.notes,
        loss_data.responsible
    )

@router.get("/losses/report")
async def get_losses_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    loss_type: Optional[str] = None
):
    return await inventory_service.get_losses_report(start_date, end_date, loss_type)

@router.post("/transfer-out")
async def register_transfer_out(transfer: TransferRequest):
    # Convert Pydantic models to dicts for service
    items_dict = [{"sku": item.sku, "quantity": item.quantity} for item in transfer.items]
    return await inventory_service.register_transfer_out(
        transfer.target_warehouse_id,
        items_dict,
        transfer.notes
    )

@router.post("/reconcile")
async def bulk_reconcile(
    adjustments: list[dict],
    current_user: User = Depends(check_role([UserRole.STOCK_MANAGER, UserRole.ADMIN, UserRole.SUPERADMIN])),
    company_id: str = Depends(get_current_company_id)
):
    """
    Endpoint robusto para reconciliación masiva de stock.
    Soporta tipado nativo para compatibilidad con Python 3.14+.
    """
    # Force company_id context for all adjustments if needed
    return await inventory_service.bulk_reconcile(adjustments, user=current_user, company_id=company_id)

@router.post("/physical-stocktake")
async def physical_stocktake(
    adjustments: List[Dict[str, Any]],
    current_user: User = Depends(check_role([UserRole.STOCK_MANAGER, UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """
    Endpoint estratégico para sinceramiento de stock por toma de inventario físico.
    Calcula deltas automáticamente y genera movimientos de ajuste de tipo STOCKTAKE.
    """
    return await inventory_service.process_physical_stocktake(adjustments, user=current_user)


# ─────────────────────────────────────────────────────────────────────────────
# VISIBILIDAD EN TIENDA — Sin CSVs, sin parches, control directo desde el ERP
# ─────────────────────────────────────────────────────────────────────────────

@router.patch("/products/{product_id}/visibility")
async def toggle_product_visibility(
    product_id: str,
    payload: VisibilityPayload,
    current_user: User = Depends(check_role([UserRole.STOCK_MANAGER, UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """
    Toggle de visibilidad individual por MongoDB ID.
    Modifica is_active_in_shop y/o is_new de un producto específico.
    """
    from beanie import PydanticObjectId
    from app.services.audit_service import AuditService

    try:
        product = await Product.get(PydanticObjectId(product_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    if product is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    changes = []
    if payload.is_active_in_shop is not None:
        product.is_active_in_shop = bool(payload.is_active_in_shop)
        changes.append(f"is_active_in_shop={product.is_active_in_shop}")

    if payload.is_new is not None:
        product.is_new = bool(payload.is_new)
        changes.append(f"is_new={product.is_new}")

    if not changes:
        raise HTTPException(status_code=400, detail="No se especificó ningún campo a modificar.")

    await product.save()

    await AuditService.log_action(
        user=current_user,
        action="VISIBILITY_TOGGLE",
        module="INVENTORY",
        description=f"Visibilidad de [{product.sku} / {product.brand}] → {', '.join(changes)}",
        entity_id=str(product.id),
        entity_name=product.sku
    )

    return {
        "sku": product.sku,
        "brand": product.brand,
        "is_active_in_shop": product.is_active_in_shop,
        "is_new": product.is_new
    }


@router.post("/products/bulk-visibility")
async def bulk_set_visibility(
    payload: BulkVisibilityPayload,
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """
    Activación / desactivación masiva de visibilidad en tienda.
    Por defecto aplica sobre todos los productos COMMERCIAL no DISCONTINUED.
    Si only_with_price=True, solo aplica a productos con precio_retail > 0.
    """
    from app.services.audit_service import AuditService

    if payload.is_active_in_shop is None and payload.is_new is None:
        raise HTTPException(status_code=400, detail="Debes especificar al menos is_active_in_shop o is_new.")

    from beanie import PydanticObjectId
    
    # Construir filtro de MongoDB
    if payload.product_ids:
        # Si se pasan IDs específicos, ignoramos los filtros generales de tipo/precio
        mongo_filter = {"_id": {"$in": [PydanticObjectId(pid) for pid in payload.product_ids]}}
    else:
        # Filtro general por criterios
        mongo_filter: dict = {
            "type": ProductType.COMMERCIAL.value,
            "status": {"$ne": ProductStatus.DISCONTINUED.value}
        }
        if payload.only_with_price:
            from app.models.pricing import PriceList, PriceEntry
            # 1. Encontrar la Lista Maestra (Source of Truth)
            master_list = await PriceList.find_one({"is_master": True})
            if not master_list:
                master_list = await PriceList.find_one({"is_active": True})
            
            if master_list:
                # 2. Obtener IDs de productos con precio cargado en la lista maestra
                # Usamos el motor directamente para evitar problemas de proyección con Pydantic v2
                price_coll = PriceEntry.get_motor_collection()
                cursor = price_coll.find(
                    {"price_list_id": master_list.id, "price": {"$gt": 0}},
                    {"product_id": 1}
                )
                priced_entries = await cursor.to_list(length=None)
                
                valid_ids = [e["product_id"] for e in priced_entries]
                mongo_filter["_id"] = {"$in": valid_ids}
            else:
                # Si no hay lista maestra, no podemos filtrar por precio de forma confiable
                # Por seguridad cerramos el filtro para que no active todo por error
                mongo_filter["_id"] = {"$in": []}

    # Construir campos a actualizar
    update_fields: dict = {}
    if payload.is_active_in_shop is not None:
        update_fields["is_active_in_shop"] = bool(payload.is_active_in_shop)
    if payload.is_new is not None:
        update_fields["is_new"] = bool(payload.is_new)

    collection = Product.get_motor_collection()
    result = await collection.update_many(mongo_filter, {"$set": update_fields})

    summary = ", ".join(f"{k}={v}" for k, v in update_fields.items())
    await AuditService.log_action(
        user=current_user,
        action="BULK_VISIBILITY",
        module="INVENTORY",
        description=f"Visibilidad masiva → {summary} | Filtro: {mongo_filter} | Afectados: {result.modified_count}",
        entity_name=f"{result.modified_count} productos"
    )

    # Para la respuesta, limpiamos el filtro de IDs masivos para evitar errores de serialización y bloat
    serializable_filter = {k: v for k, v in mongo_filter.items() if k != "_id"}
    if "_id" in mongo_filter:
        serializable_filter["ids_count"] = len(mongo_filter["_id"].get("$in", []))

    return {
        "matched": result.matched_count,
        "modified": result.modified_count,
        "fields_set": update_fields,
        "filter_applied": serializable_filter
    }

@router.post("/check-existence")
async def check_existence(items: List[Dict[str, str]]):
    """
    Verifica existencia de SKUs y Marcas de forma masiva.
    """
    return await inventory_service.check_products_existence(items)
