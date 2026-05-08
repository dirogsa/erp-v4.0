from fastapi import APIRouter, Depends
from typing import Optional
from pydantic import BaseModel
from app.models.inventory import DeliveryGuide
from app.services import delivery_service
from app.schemas.common import PaginatedResponse

from .auth import get_current_user, check_role
from app.dependencies.company import get_current_company_id

router = APIRouter(prefix="/delivery", tags=["Delivery Guides"])


class GuideCreation(BaseModel):
    invoice_number: str
    sunat_number: Optional[str] = None
    vehicle_plate: Optional[str] = None
    driver_name: Optional[str] = None
    notes: Optional[str] = None
    created_by: Optional[str] = None


class DeliveryConfirmation(BaseModel):
    received_by: Optional[str] = None


class BulkGuideAction(BaseModel):
    guide_numbers: list[str]
    received_by: Optional[str] = None
    revert: bool = False


# ==================== GUIDES ====================

@router.get("/guides", response_model=PaginatedResponse[DeliveryGuide])
async def get_guides(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    status: Optional[str] = None,
    guide_type: Optional[str] = None
):
    return await delivery_service.get_guides(skip, limit, search, status, guide_type)


@router.get("/guides/{guide_number}", response_model=DeliveryGuide)
async def get_guide(guide_number: str):
    return await delivery_service.get_guide(guide_number)


@router.post("/guides", response_model=DeliveryGuide)
async def create_guide(data: GuideCreation):
    return await delivery_service.create_guide_from_invoice(
        invoice_number=data.invoice_number,
        sunat_number=data.sunat_number,
        vehicle_plate=data.vehicle_plate,
        driver_name=data.driver_name,
        notes=data.notes,
        created_by=data.created_by
    )


@router.put("/guides/{guide_number}/prepare")
async def prepare_guide(
    guide_number: str,
    company_id: str = Depends(get_current_company_id)
):
    """Marcar guía como LISTA para despacho"""
    return await delivery_service.prepare_guide(guide_number, company_id=company_id)


@router.put("/guides/{guide_number}/dispatch")
async def dispatch_guide(
    guide_number: str,
    company_id: str = Depends(get_current_company_id)
):
    """Confirmar despacho de la guía (Salida de stock)"""
    return await delivery_service.dispatch_guide(guide_number, company_id=company_id)


@router.put("/guides/{guide_number}/deliver", response_model=DeliveryGuide)
async def deliver_guide(guide_number: str, data: DeliveryConfirmation):
    """Confirmar entrega de la guía"""
    return await delivery_service.deliver_guide(guide_number, data.received_by)


@router.delete("/guides/{guide_number}", response_model=DeliveryGuide)
async def cancel_guide(
    guide_number: str,
    company_id: str = Depends(get_current_company_id)
):
    """Anular guía - DEVUELVE STOCK si fue despachada"""
    return await delivery_service.cancel_guide(guide_number, company_id=company_id)


# ==================== BULK ACTIONS ====================

@router.post("/guides/bulk-prepare")
async def bulk_prepare_guides(
    data: BulkGuideAction,
    company_id: str = Depends(get_current_company_id)
):
    """Preparar masivamente guías"""
    return await delivery_service.bulk_prepare_guides(data.guide_numbers, company_id=company_id)


@router.post("/guides/bulk-dispatch")
async def bulk_dispatch_guides(
    data: BulkGuideAction,
    company_id: str = Depends(get_current_company_id)
):
    """Despachar masivamente guías"""
    return await delivery_service.bulk_dispatch_guides(data.guide_numbers, company_id=company_id)


@router.post("/guides/bulk-deliver")
async def bulk_deliver_guides(
    data: BulkGuideAction,
    company_id: str = Depends(get_current_company_id)
):
    """Confirmar entrega masiva de guías"""
    return await delivery_service.bulk_deliver_guides(data.guide_numbers, data.received_by, company_id=company_id)


@router.post("/guides/bulk-delete")
async def bulk_delete_guides(
    data: BulkGuideAction,
    company_id: str = Depends(get_current_company_id)
):
    """Anular o Revertir masivamente guías"""
    return await delivery_service.bulk_delete_guides(data.guide_numbers, company_id=company_id, revert_to_draft=data.revert)
