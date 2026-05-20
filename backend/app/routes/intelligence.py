from fastapi import APIRouter, Depends, Query
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.services.intelligence_service import IntelligenceService
from app.routes.auth import get_current_user, check_role
from app.models.auth import User, UserRole

router = APIRouter(prefix="/intelligence", tags=["Intelligence & Analytics"])

@router.get("/import-planning")
async def get_import_planning(
    company_id: Optional[str] = None,
    lead_time_days: int = Query(60, ge=1, le=180),
    supply_days: int = Query(90, ge=0, le=365),
    service_level: float = Query(0.95, ge=0.90, le=0.99),
    analysis_days: int = Query(180, ge=30, le=730),
    recent_days: int = Query(30, ge=7, le=90),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """
    Retorna el plan de importación sugerido basado en algoritmos predictivos.
    Permite ajustar parámetros de suministro, ventanas de tendencia y periodos de abastecimiento.
    """
    return await IntelligenceService.get_import_planning(
        company_id=company_id,
        lead_time_days=lead_time_days,
        supply_days=supply_days,
        service_level=service_level,
        analysis_days=analysis_days,
        recent_days=recent_days
    )

@router.get("/sincerity/unmapped")
async def get_unmapped_items(
    company_id: Optional[str] = None,
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """Retorna ítems de XMLs importados que no tienen SKU reconocido."""
    comp_id = company_id or current_user.current_company_id
    return await IntelligenceService.get_unmapped_catalog_items(comp_id)

class EditUnmappedRequest(BaseModel):
    old_external_code: str
    old_brand: str
    new_external_code: str
    new_description: str
    new_brand: str

@router.put("/sincerity/unmapped/edit")
async def edit_unmapped_item(
    request: EditUnmappedRequest,
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """Edita directamente un ítem en incubación, modificando las facturas de origen para limpiarlo."""
    return await IntelligenceService.edit_unmapped_item(
        old_external_code=request.old_external_code,
        old_brand=request.old_brand,
        new_external_code=request.new_external_code,
        new_description=request.new_description,
        new_brand=request.new_brand,
        company_id=current_user.current_company_id
    )

class CatalogMappingRequest(BaseModel):
    external_code: str
    brand: str
    internal_sku: str
    create_alias: bool = True

@router.post("/sincerity/map")
async def resolve_catalog_mapping(
    request: CatalogMappingRequest,
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """Vincula un código externo con un SKU real y procesa facturas pendientes."""
    return await IntelligenceService.resolve_catalog_mapping(
        external_code=request.external_code,
        brand=request.brand,
        internal_sku=request.internal_sku,
        company_id=current_user.current_company_id,
        create_alias=request.create_alias
    )

class GhostMappingRequest(BaseModel):
    external_code: Optional[str] = None
    brand: Optional[str] = None
    category_id: str

@router.post("/sincerity/map-ghost")
async def map_ghost_sku(
    request: GhostMappingRequest,
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """Aisla un código desconocido en Cuarentena creando un Ghost SKU, SIN aprender (alias)."""
    return await IntelligenceService.map_ghost_sku(
        external_code=request.external_code,
        brand=request.brand,
        category_id=request.category_id,
        company_id=current_user.current_company_id
    )

@router.get("/sincerity/master-gaps")
async def get_master_gaps(
    company_id: Optional[str] = None,
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """Detecta inconsistencias en Clientes y Tipos de Cambio."""
    comp_id = company_id or current_user.current_company_id
    return await IntelligenceService.get_master_data_gaps(comp_id)

class RateSincerityRequest(BaseModel):
    date: str
    sale_rate: float
    buy_rate: Optional[float] = None

@router.post("/sincerity/resolve-rate")
async def resolve_rate(
    request: RateSincerityRequest,
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """Resuelve brechas de TC en bloque."""
    return await IntelligenceService.resolve_exchange_rate_sincerity(
        date_str=request.date,
        sale_rate=request.sale_rate,
        buy_rate=request.buy_rate
    )

class CustomerLinkRequest(BaseModel):
    ruc: str
    customer_id: str

@router.post("/sincerity/resolve-customer")
async def resolve_customer(
    request: CustomerLinkRequest,
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """Vincula RUCs desconocidos a clientes del maestro."""
    return await IntelligenceService.resolve_customer_sincerity(
        ruc=request.ruc,
        customer_id=request.customer_id
    )

class AutoCreateCustomerRequest(BaseModel):
    ruc: str
    name: str

@router.post("/sincerity/auto-create-customer")
async def auto_create_customer(
    request: AutoCreateCustomerRequest,
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """Crea un cliente automáticamente desde el flujo de sinceramiento."""
    return await IntelligenceService.auto_create_customer_from_gap(
        ruc=request.ruc,
        name=request.name,
        company_id=current_user.current_company_id
    )

@router.post("/sincerity/bulk-auto-create-customers")
async def bulk_auto_create_customers(
    request: List[AutoCreateCustomerRequest],
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """Crea múltiples clientes automáticamente."""
    return await IntelligenceService.bulk_auto_create_customers(
        customers=[c.dict() for c in request],
        company_id=current_user.current_company_id
    )

@router.post("/ingest/xml")
async def universal_xml_ingest(
    request: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Ruta única para procesar cualquier XML (Venta o Compra)."""
    return await IntelligenceService.universal_xml_ingest(
        xml_data=request,
        user=current_user
    )

@router.get("/ingest/queue")
async def get_ingest_queue(
    current_user: User = Depends(get_current_user)
):
    """Retorna la cola de ingesta persistente de la empresa."""
    return await IntelligenceService.get_ingestion_queue(current_user.current_company_id)

@router.post("/ingest/queue/batch")
async def add_to_ingest_queue(
    request: List[Dict[str, Any]],
    current_user: User = Depends(get_current_user)
):
    """Agrega una lista de XMLs analizados a la cola persistente."""
    return await IntelligenceService.add_to_ingestion_queue(request, current_user)

@router.delete("/ingest/queue/clear")
async def clear_ingest_queue(
    current_user: User = Depends(get_current_user)
):
    """Limpia la cola de ingesta de la empresa."""
    return await IntelligenceService.clear_ingestion_queue(current_user.current_company_id)

@router.post("/ingest/queue/process/{ingest_id}")
async def process_ingest_item(
    ingest_id: str,
    current_user: User = Depends(get_current_user)
):
    """Procesa un ítem de la cola persistente."""
    return await IntelligenceService.process_ingestion_item(ingest_id, current_user)
@router.get("/sincerity/pending-guides")
async def get_pending_guides(
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """Retorna facturas de venta que esperan vinculación de guía."""
    return await IntelligenceService.get_pending_dispatch_invoices(current_user.current_company_id)

class BulkGuideRequest(BaseModel):
    invoice_ids: List[str]

@router.post("/sincerity/bulk-generate-guides")
async def bulk_generate_guides(
    request: BulkGuideRequest,
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """Genera guías internas automáticas para un lote de facturas."""
    return await IntelligenceService.bulk_generate_sales_guides(request.invoice_ids, current_user)

@router.post("/sincerity/match-xml-guides")
async def match_xml_guides(
    request: List[Dict[str, Any]],
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """Vincula guías XML externas de SUNAT con facturas existentes."""
    return await IntelligenceService.match_xml_guides(request, current_user.current_company_id)

@router.post("/sincerity/revert-logistics/{invoice_id}")
async def revert_logistics(
    invoice_id: str,
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """Desvincula una guía y devuelve la factura a estado PENDING_GUIDE."""
    return await IntelligenceService.revert_logistics_status(invoice_id, current_user.current_company_id)

class ReprocessRequest(BaseModel):
    section: str  # "catalog" | "master" | "logistics" | "all"

@router.post("/sincerity/reprocess")
async def reprocess_sincerity(
    request: ReprocessRequest,
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """
    Ejecuta el motor de reprocesamiento masivo para curar brechas de la empresa.
    """
    return await IntelligenceService.reprocess_sincerity_pipeline(
        company_id=current_user.current_company_id,
        section=request.section
    )

# ═══════════════════════════════════════════════════════════════
# SUPPLIER CROSS-REFERENCE TABLE (Product Alias Governance)
# ═══════════════════════════════════════════════════════════════

@router.get("/sincerity/aliases")
async def get_product_aliases(
    search: Optional[str] = None,
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """
    Retorna todos los alias de productos (Glosario de Proveedores) de la empresa.
    Permite búsqueda por código externo, SKU interno, o nombre de proveedor.
    """
    from app.models.product_alias import ProductAlias
    query = {"company_id": current_user.current_company_id}
    if search:
        search_regex = {"$regex": search, "$options": "i"}
        query["$or"] = [
            {"external_code": search_regex},
            {"internal_sku": search_regex},
            {"internal_product_name": search_regex},
            {"supplier_name": search_regex},
            {"supplier_ruc": search_regex},
        ]
    aliases = await ProductAlias.find(query).sort("-created_at").to_list()
    return [a.model_dump(mode="json") for a in aliases]

@router.delete("/sincerity/aliases/{alias_id}")
async def delete_product_alias(
    alias_id: str,
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """
    Elimina un alias de producto. Esto no afecta facturas ya procesadas,
    pero sí impide que futuras facturas con ese código se auto-mapeen.
    """
    from app.models.product_alias import ProductAlias
    from beanie import PydanticObjectId
    alias = await ProductAlias.get(PydanticObjectId(alias_id))
    if not alias:
        return {"status": "error", "message": "Alias no encontrado"}
    if alias.company_id != current_user.current_company_id:
        return {"status": "error", "message": "No tienes permisos para eliminar este alias"}
    await alias.delete()
    return {"status": "ok", "message": f"Alias '{alias.external_code}' → '{alias.internal_sku}' eliminado exitosamente."}
