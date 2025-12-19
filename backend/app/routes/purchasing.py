from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from beanie import PydanticObjectId
from app.models.purchasing import PurchaseOrder, PurchaseInvoice, Supplier, PaymentStatus
from app.services import purchasing_service
from app.schemas.purchasing_schemas import InvoiceCreation, PaymentRegistration, ReceptionRequest
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/purchasing", tags=["Purchasing"])

# ==================== ORDERS ====================

@router.post("/orders", response_model=PurchaseOrder)
async def create_order(order: PurchaseOrder):
    return await purchasing_service.create_order(order)

@router.get("/orders", response_model=PaginatedResponse[PurchaseOrder])
async def get_orders(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
):
    return await purchasing_service.get_orders(skip, limit, search, status, date_from, date_to)

# ==================== INVOICES ====================

@router.post("/invoices", response_model=PurchaseInvoice)
async def create_invoice(invoice_data: InvoiceCreation):
    return await purchasing_service.create_invoice(
        invoice_data.order_number,
        invoice_data.sunat_number,
        invoice_data.invoice_date,
        invoice_data.payment_status,
        invoice_data.amount_paid,
        invoice_data.payment_date
    )

@router.get("/invoices", response_model=PaginatedResponse[PurchaseInvoice])
async def get_invoices(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    payment_status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
):
    return await purchasing_service.get_invoices(skip, limit, search, payment_status, date_from, date_to)

@router.get("/invoices/{invoice_number}", response_model=PurchaseInvoice)
async def get_invoice(invoice_number: str):
    return await purchasing_service.get_invoice(invoice_number)

@router.delete("/invoices/{invoice_number}")
async def delete_invoice(invoice_number: str):
    await purchasing_service.delete_invoice(invoice_number)
    return {"message": "Invoice deleted successfully"}

@router.delete("/orders/{order_number}")
async def delete_order(order_number: str):
    await purchasing_service.delete_order(order_number)
    return {"message": "Order deleted successfully"}

# ==================== PAYMENTS ====================

@router.post("/invoices/{invoice_number}/payments")
async def register_payment(invoice_number: str, payment_data: PaymentRegistration):
    return await purchasing_service.register_payment(
        invoice_number,
        payment_data.amount,
        payment_data.payment_date,
        payment_data.notes
    )

# ==================== SUPPLIERS ====================

@router.get("/suppliers", response_model=List[Supplier])
async def get_suppliers():
    return await purchasing_service.get_suppliers()

@router.post("/suppliers", response_model=Supplier)
async def create_supplier(supplier: Supplier):
    return await purchasing_service.create_supplier(supplier)

@router.delete("/suppliers/{id}")
async def delete_supplier(id: PydanticObjectId):
    await purchasing_service.delete_supplier(id)
    return {"message": "Supplier deleted"}

@router.put("/suppliers/{id}", response_model=Supplier)
async def update_supplier(id: PydanticObjectId, supplier_data: Supplier):
    return await purchasing_service.update_supplier(id, supplier_data)

# ==================== RECEPTION ====================

@router.post("/invoices/{invoice_number}/receive")
async def create_reception_guide(invoice_number: str, reception_data: ReceptionRequest):
    return await purchasing_service.create_reception_guide(
        invoice_number,
        reception_data.notes,
        reception_data.created_by
    )
