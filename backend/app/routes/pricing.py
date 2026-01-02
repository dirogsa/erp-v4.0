from fastapi import APIRouter, Depends, HTTPException
from typing import List
from ..models.pricing import PricingRule
from ..schemas.pricing import PricingRuleCreate, PricingRuleResponse
from ..routes.auth import get_current_user, check_role
from ..models.auth import User, UserRole

router = APIRouter(prefix="/pricing", tags=["pricing"])

@router.post("/rules", response_model=PricingRuleResponse)
async def create_pricing_rule(rule: PricingRuleCreate, current_user: User = Depends(check_role([UserRole.SUPERADMIN, UserRole.ADMIN]))):
    new_rule = PricingRule(**rule.dict())
    await new_rule.insert()
    
    # Return with ID as string for pydantic
    resp = PricingRuleResponse(**new_rule.dict(), id=str(new_rule.id))
    return resp

@router.get("/rules", response_model=List[PricingRuleResponse])
async def get_pricing_rules(current_user: User = Depends(check_role([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF]))):
    rules = await PricingRule.find_all().to_list()
    return [PricingRuleResponse(**r.dict(), id=str(r.id)) for r in rules]

@router.put("/rules/{rule_id}", response_model=PricingRuleResponse)
async def update_pricing_rule(rule_id: str, rule_update: PricingRuleCreate, current_user: User = Depends(check_role([UserRole.SUPERADMIN, UserRole.ADMIN]))):
    existing_rule = await PricingRule.get(rule_id)
    if not existing_rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    update_data = rule_update.dict()
    for key, value in update_data.items():
        setattr(existing_rule, key, value)
    
    await existing_rule.save()
    return PricingRuleResponse(**existing_rule.dict(), id=str(existing_rule.id))

@router.delete("/rules/{rule_id}")
async def delete_pricing_rule(rule_id: str, current_user: User = Depends(check_role([UserRole.SUPERADMIN, UserRole.ADMIN]))):
    rule = await PricingRule.get(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    await rule.delete()
    return {"message": "Rule deleted"}
