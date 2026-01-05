from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.models.marketing import LoyaltyConfig, LoyaltyConfigUpdate
from app.models.auth import User, UserRole
from app.routes.auth import check_role

router = APIRouter(prefix="/marketing", tags=["Marketing"])

@router.get("/loyalty/config", response_model=LoyaltyConfig)
async def get_loyalty_config():
    config = await LoyaltyConfig.find_one({})
    if not config:
        # Create default if not exists
        config = LoyaltyConfig()
        await config.insert()
    return config

@router.put("/loyalty/config", response_model=LoyaltyConfig)
async def update_loyalty_config(
    update: LoyaltyConfigUpdate,
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    config = await LoyaltyConfig.find_one({})
    if not config:
        config = LoyaltyConfig()
    
    config.points_per_sole = update.points_per_sole
    config.is_active = update.is_active
    await config.save()
    return config
