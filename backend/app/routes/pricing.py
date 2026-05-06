from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from ..models.pricing import PriceList, PriceEntry
from ..services.pricing_service import PricingService
from ..models.auth import User, UserRole
from ..routes.auth import check_role
from beanie import PydanticObjectId
from pydantic import BaseModel

router = APIRouter(prefix="/pricing", tags=["Pricing & Campaigns"])

class MasterPriceUpdate(BaseModel):
    sku: str
    price: float
    currency: str = "PEN"

class BulkCampaignUpdate(BaseModel):
    skus: List[str]

@router.get("/resolve/{sku}")
async def resolve_price(sku: str, qty: int = 1):
    """Resolves the final price for a product considering all active campaigns."""
    return await PricingService.get_product_price(sku, qty)

@router.post("/master", dependencies=[Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))])
async def set_master_price(data: MasterPriceUpdate):
    """Fast entry for Master Prices."""
    try:
        entry = await PricingService.set_master_price(data.sku, data.price, data.currency)
        return {"message": f"Master price updated for {data.sku}", "entry": entry}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/campaign/{campaign_id}/add-skus", dependencies=[Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))])
async def add_skus_to_campaign(campaign_id: str, data: BulkCampaignUpdate):
    """Massive adjustment: Adds multiple SKUs to a specific campaign."""
    try:
        campaign = await PricingService.add_skus_to_campaign(PydanticObjectId(campaign_id), data.skus)
        return {
            "message": f"Added {len(data.skus)} SKUs to campaign {campaign.name}",
            "targeted_count": len(campaign.targeted_skus)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/lists", response_model=List[PriceList])
async def list_price_lists():
    """List all price lists and campaigns."""
    return await PriceList.find_all().to_list()

@router.post("/lists", response_model=PriceList, dependencies=[Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))])
async def create_price_list(price_list: PriceList):
    """Create a new Price List or Campaign."""
    await price_list.insert()
    return price_list

@router.get("/entries/{price_list_id}", response_model=List[PriceEntry])
async def get_entries(price_list_id: str):
    """Get fixed price entries for a specific list."""
    return await PriceEntry.find(PriceEntry.price_list_id == PydanticObjectId(price_list_id)).to_list()
