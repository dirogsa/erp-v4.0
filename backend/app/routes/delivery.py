from fastapi import APIRouter
from typing import Optional
from pydantic import BaseModel
from app.models.inventory import DeliveryGuide
from app.services import delivery_service
from app.schemas.common import PaginatedResponse

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


@router.put("/guides/{guide_number}/dispatch", response_model=DeliveryGuide)
async def dispatch_guide(guide_number: str):
    """Marcar guía como despachada - DESCUENTA STOCK"""
    return await delivery_service.dispatch_guide(guide_number)


@router.put("/guides/{guide_number}/deliver", response_model=DeliveryGuide)
async def deliver_guide(guide_number: str, data: DeliveryConfirmation):
    """Confirmar entrega de la guía"""
    return await delivery_service.deliver_guide(guide_number, data.received_by)


@router.delete("/guides/{guide_number}", response_model=DeliveryGuide)
async def cancel_guide(guide_number: str):
    """Anular guía - DEVUELVE STOCK si fue despachada"""
    return await delivery_service.cancel_guide(guide_number)
