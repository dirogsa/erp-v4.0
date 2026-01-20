from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime
from ..models.auth import User, UserRole
from ..models.sales import SalesPolicy
from ..schemas.sales_schemas import SalesPolicyUpdate, SalesPolicyResponse
from .auth import get_current_user, check_role

router = APIRouter(prefix="/sales/config", tags=["Sales Configuration"])

@router.get("/policies", response_model=SalesPolicyResponse)
async def get_sales_policies():
    """Obtiene los porcentajes de recargo actuales"""
    policy = await SalesPolicy.find_one()
    if not policy:
        # Create default if not exists
        policy = SalesPolicy()
        await policy.insert()
    
    return SalesPolicyResponse(
        cash_discount=policy.cash_discount,
        credit_30_days=policy.credit_30_days,
        credit_60_days=policy.credit_60_days,
        credit_90_days=policy.credit_90_days,
        credit_180_days=policy.credit_180_days,
        retail_markup_pct=policy.retail_markup_pct,
        vol_6_discount_pct=policy.vol_6_discount_pct,
        vol_12_discount_pct=policy.vol_12_discount_pct,
        vol_24_discount_pct=policy.vol_24_discount_pct,
        min_margin_guard_pct=policy.min_margin_guard_pct,
        last_updated=policy.last_updated.isoformat(),
        updated_by=policy.updated_by
    )

@router.put("/policies", response_model=SalesPolicyResponse)
async def update_sales_policies(
    policy_in: SalesPolicyUpdate,
    current_user: User = Depends(check_role([UserRole.SUPERADMIN]))
):
    """Actualiza los porcentajes de recargo (Solo SuperAdmin)"""
    policy = await SalesPolicy.find_one()
    if not policy:
        policy = SalesPolicy()
    
    policy.cash_discount = policy_in.cash_discount
    policy.credit_30_days = policy_in.credit_30_days
    policy.credit_60_days = policy_in.credit_60_days
    policy.credit_90_days = policy_in.credit_90_days
    policy.credit_180_days = policy_in.credit_180_days
    
    # Update new fields
    policy.retail_markup_pct = policy_in.retail_markup_pct
    policy.vol_6_discount_pct = policy_in.vol_6_discount_pct
    policy.vol_12_discount_pct = policy_in.vol_12_discount_pct
    policy.vol_24_discount_pct = policy_in.vol_24_discount_pct
    policy.min_margin_guard_pct = policy_in.min_margin_guard_pct

    policy.last_updated = datetime.utcnow()
    policy.updated_by = current_user.username
    
    await policy.save()
    
    return SalesPolicyResponse(
        cash_discount=policy.cash_discount,
        credit_30_days=policy.credit_30_days,
        credit_60_days=policy.credit_60_days,
        credit_90_days=policy.credit_90_days,
        credit_180_days=policy.credit_180_days,
        retail_markup_pct=policy.retail_markup_pct,
        vol_6_discount_pct=policy.vol_6_discount_pct,
        vol_12_discount_pct=policy.vol_12_discount_pct,
        vol_24_discount_pct=policy.vol_24_discount_pct,
        min_margin_guard_pct=policy.min_margin_guard_pct,
        last_updated=policy.last_updated.isoformat(),
        updated_by=policy.updated_by
    )
