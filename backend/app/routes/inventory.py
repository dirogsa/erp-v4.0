from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from fastapi.responses import StreamingResponse
from typing import List, Optional
from pydantic import BaseModel
from app.models.inventory import Product, Warehouse, MovementType
from app.models.auth import User, UserRole
from app.services import inventory_service
from app.schemas.inventory_schemas import LossRegistration, TransferRequest
from app.schemas.common import PaginatedResponse
from .auth import get_current_user, check_role

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.get("/products", response_model=PaginatedResponse[Product])
async def get_products(
    skip: int = 0, 
    limit: int = 50, 
    search: Optional[str] = None, 
    category: Optional[str] = None,
    redeemable_only: Optional[bool] = None,
    product_type: Optional[str] = None
):
    return await inventory_service.get_products(skip, limit, search, category, redeemable_only, product_type)

@router.get("/generate-marketing-sku")
async def generate_marketing_sku():
    sku = await inventory_service.generate_marketing_sku()
    return {"sku": sku}

@router.post("/products", response_model=Product)
async def create_product(
    product: Product, 
    initial_stock: int = 0,
    current_user: User = Depends(check_role([UserRole.STOCK_MANAGER, UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    return await inventory_service.create_product(product, initial_stock, user=current_user)

@router.put("/products/{sku}", response_model=Product)
async def update_product(
    sku: str, 
    product_data: Product, 
    new_stock: int = None,
    current_user: User = Depends(check_role([UserRole.STOCK_MANAGER, UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    return await inventory_service.update_product(sku, product_data, new_stock, user=current_user)

@router.delete("/products/{sku}")
async def delete_product(
    sku: str,
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    await inventory_service.delete_product(sku, user=current_user)
    return {"message": "Product deleted successfully"}

@router.get("/warehouses", response_model=List[Warehouse])
async def get_warehouses():
    return await inventory_service.get_warehouses()

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

