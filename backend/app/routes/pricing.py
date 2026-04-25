from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from typing import List
from ..models.pricing import PricingRule, PriceList, PriceEntry
from ..schemas.pricing import (
    PricingRuleCreate, PricingRuleResponse,
    PriceListCreate, PriceListResponse,
    PriceEntryCreate, PriceEntryResponse,
    BulkTextUpdate
)
from ..routes.auth import get_current_user, check_role
from ..models.auth import User, UserRole
from beanie import PydanticObjectId
from ..services import price_service

router = APIRouter(prefix="/pricing", tags=["pricing"])

# --- Price Lists ---
@router.post("/lists", response_model=PriceListResponse)
async def create_price_list(data: PriceListCreate, current_user: User = Depends(check_role([UserRole.SUPERADMIN, UserRole.ADMIN]))):
    new_list = PriceList(**data.dict())
    await new_list.insert()
    # Manual conversion to ensure ID is a string for Pydantic validation
    res_data = new_list.dict()
    res_data["id"] = str(new_list.id)
    return res_data

@router.get("/lists", response_model=List[PriceListResponse])
async def get_price_lists(current_user: User = Depends(check_role([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF]))):
    lists = await PriceList.find_all().to_list()
    results = []
    for l in lists:
        data = l.dict()
        data["id"] = str(l.id)
        results.append(data)
    return results

@router.delete("/lists/{list_id}")
async def delete_price_list(list_id: str, current_user: User = Depends(check_role([UserRole.SUPERADMIN, UserRole.ADMIN]))):
    plist = await PriceList.get(list_id)
    if not plist:
        raise HTTPException(status_code=404, detail="Price List not found")
    await plist.delete()
    # Also delete associated entries
    await PriceEntry.find(PriceEntry.price_list_id == PydanticObjectId(list_id)).delete()
    return {"message": "Price List and entries deleted"}

# --- Price Entries ---
@router.post("/entries", response_model=PriceEntryResponse)
async def create_price_entry(data: PriceEntryCreate, current_user: User = Depends(check_role([UserRole.SUPERADMIN, UserRole.ADMIN]))):
    # Convert IDs to PydanticObjectId
    entry_dict = data.dict()
    entry_dict["product_id"] = PydanticObjectId(entry_dict["product_id"])
    entry_dict["price_list_id"] = PydanticObjectId(entry_dict["price_list_id"])
    
    new_entry = PriceEntry(**entry_dict)
    await new_entry.save() # save() handles upsert if index matches or insert if new
    
    res_data = new_entry.dict()
    res_data["id"] = str(new_entry.id)
    res_data["product_id"] = str(new_entry.product_id)
    res_data["price_list_id"] = str(new_entry.price_list_id)
    return res_data

@router.get("/entries/{list_id}", response_model=List[PriceEntryResponse])
async def get_price_entries(list_id: str, current_user: User = Depends(check_role([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF]))):
    entries = await PriceEntry.find(PriceEntry.price_list_id == PydanticObjectId(list_id)).to_list()
    results = []
    for e in entries:
        data = e.dict()
        data["id"] = str(e.id)
        data["product_id"] = str(e.product_id)
        data["price_list_id"] = str(e.price_list_id)
        results.append(data)
    return results

# --- Pricing Rules (Legacy compatibility + new fields) ---
@router.post("/rules", response_model=PricingRuleResponse)
async def create_pricing_rule(rule: PricingRuleCreate, current_user: User = Depends(check_role([UserRole.SUPERADMIN, UserRole.ADMIN]))):
    new_rule = PricingRule(**rule.dict())
    await new_rule.insert()
    
    res_data = new_rule.dict()
    res_data["id"] = str(new_rule.id)
    if new_rule.target_category_id:
        res_data["target_category_id"] = str(new_rule.target_category_id)
    return res_data

@router.get("/rules", response_model=List[PricingRuleResponse])
async def get_pricing_rules(current_user: User = Depends(check_role([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF]))):
    rules = await PricingRule.find_all().to_list()
    results = []
    for r in rules:
        data = r.dict()
        data["id"] = str(r.id)
        if r.target_category_id:
            data["target_category_id"] = str(r.target_category_id)
        results.append(data)
    return results

# --- Bulk Operations ---

@router.post("/bulk-update")
async def bulk_update_prices(
    data: BulkTextUpdate, 
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    updated = 0
    errors = []
    
    for item in data.items:
        try:
            await price_service.update_price(
                sku=item.sku, 
                price=float(item.price), 
                list_name=data.list_name
            )
            updated += 1
        except Exception as e:
            errors.append({"sku": item.sku, "error": str(e)})
            
    return {
        "updated": updated,
        "errors": errors
    }

@router.post("/import-csv")
async def import_prices_csv(
    file: UploadFile = File(...),
    list_name: str = Query("General"),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    content = await file.read()
    result = await price_service.bulk_update_from_csv(content.decode('utf-8'), list_name)
    return result
