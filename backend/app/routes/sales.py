from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from beanie import PydanticObjectId
from app.models.sales import SalesOrder, SalesInvoice, Customer, PaymentStatus, CustomerBranch
from app.services import sales_service
from app.schemas.sales_schemas import InvoiceCreation, PaymentRegistration, DispatchRequest
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/sales", tags=["Sales"])

# ==================== ORDERS ====================

@router.post("/orders", response_model=SalesOrder)
async def create_order(order: SalesOrder):
    return await sales_service.create_order(order)

@router.get("/orders", response_model=PaginatedResponse[SalesOrder])
async def get_orders(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
):
    return await sales_service.get_orders(skip, limit, search, status, date_from, date_to)

@router.post("/orders/{order_number}/convert")
async def convert_order(order_number: str):
    return await sales_service.convert_backorder(order_number)

@router.get("/orders/{order_number}/availability")
async def check_order_availability(order_number: str):
    return await sales_service.check_backorder_availability(order_number)

@router.get("/products/{sku}/history")
async def get_product_history(sku: str, limit: int = 10, customer_ruc: Optional[str] = None):
    return await sales_service.get_product_sales_history(sku, limit, customer_ruc)

# ==================== INVOICES ====================

@router.post("/invoices", response_model=SalesInvoice)
async def create_invoice(invoice_data: InvoiceCreation):
    return await sales_service.create_invoice(
        invoice_data.order_number,
        invoice_data.invoice_date,
        invoice_data.sunat_number,
        invoice_data.payment_status,
        invoice_data.amount_paid,
        invoice_data.payment_date,
        invoice_data.amount_in_words,
        invoice_data.payment_terms,
        invoice_data.due_date,
        invoice_data.issuer_info,
        invoice_data.items
    )

@router.get("/invoices", response_model=PaginatedResponse[SalesInvoice])
async def get_invoices(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    payment_status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
):
    return await sales_service.get_invoices(skip, limit, search, payment_status, date_from, date_to)

@router.get("/invoices/{invoice_number}", response_model=SalesInvoice)
async def get_invoice(invoice_number: str):
    return await sales_service.get_invoice(invoice_number)

@router.delete("/invoices/{invoice_number}")
async def delete_invoice(invoice_number: str):
    await sales_service.delete_invoice(invoice_number)
    return {"message": "Invoice deleted successfully"}

@router.delete("/orders/{order_number}")
async def delete_order(order_number: str):
    await sales_service.delete_order(order_number)
    return {"message": "Order deleted successfully"}

# ==================== PAYMENTS ====================

@router.post("/invoices/{invoice_number}/payments")
async def register_payment(invoice_number: str, payment_data: PaymentRegistration):
    return await sales_service.register_payment(
        invoice_number,
        payment_data.amount,
        payment_data.payment_date,
        payment_data.notes
    )

# ==================== CUSTOMERS ====================

@router.get("/customers")
async def get_customers():
    return await sales_service.get_customers()

@router.get("/customers/by-ruc/{ruc}", response_model=Customer)
async def get_customer_by_ruc(ruc: str):
    return await sales_service.get_customer_by_ruc(ruc)

@router.post("/customers", response_model=Customer)
async def create_customer(customer: Customer):
    return await sales_service.create_customer(customer)

@router.delete("/customers/{id}")
async def delete_customer(id: PydanticObjectId):
    await sales_service.delete_customer(id)
    return {"message": "Customer deleted"}

@router.put("/customers/{id}", response_model=Customer)
async def update_customer(id: PydanticObjectId, customer_data: Customer):
    return await sales_service.update_customer(id, customer_data)

# ==================== CUSTOMER BRANCHES ====================

@router.post("/customers/{id}/branches", response_model=Customer)
async def add_customer_branch(id: PydanticObjectId, branch: CustomerBranch):
    return await sales_service.add_customer_branch(id, branch)

@router.get("/customers/{id}/branches", response_model=List[CustomerBranch])
async def get_customer_branches(id: PydanticObjectId):
    return await sales_service.get_customer_branches(id)

@router.put("/customers/{id}/branches/{branch_index}", response_model=Customer)
async def update_customer_branch(id: PydanticObjectId, branch_index: int, branch: CustomerBranch):
    return await sales_service.update_customer_branch(id, branch_index, branch)

@router.delete("/customers/{id}/branches/{branch_index}", response_model=Customer)
async def delete_customer_branch(id: PydanticObjectId, branch_index: int):
    return await sales_service.delete_customer_branch(id, branch_index)

# ==================== DISPATCH ====================

@router.post("/invoices/{invoice_number}/dispatch")
async def create_dispatch_guide(invoice_number: str, dispatch_data: DispatchRequest):
    return await sales_service.create_dispatch_guide(
        invoice_number,
        dispatch_data.notes,
        dispatch_data.created_by
    )
