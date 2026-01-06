from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.models.marketing import LoyaltyConfig, LoyaltyConfigUpdate
from app.models.auth import User, UserRole
from app.routes.auth import check_role
from pydantic import BaseModel
from beanie import PydanticObjectId

router = APIRouter(prefix="/marketing", tags=["Marketing"])

class PointsConversionRequest(BaseModel):
    user_id: str
    points_to_convert: int

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
    config.local_to_web_rate = update.local_to_web_rate
    config.only_web_accumulation = update.only_web_accumulation
    config.is_active = update.is_active
    await config.save()
    return config

@router.post("/loyalty/convert-points")
async def convert_points(
    req: PointsConversionRequest,
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    user = await User.get(PydanticObjectId(req.user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    config = await LoyaltyConfig.find_one({})
    rate = config.local_to_web_rate if config else 1.0
    
    if (user.internal_points_local or 0) < req.points_to_convert:
        raise HTTPException(status_code=400, detail="Insufficient local points")
    
    # Calculate web points to grant
    web_points_granted = int(req.points_to_convert * rate)
    
    # Atomic update
    user.internal_points_local = (user.internal_points_local or 0) - req.points_to_convert
    user.loyalty_points = (user.loyalty_points or 0) + web_points_granted
    
    await user.save()
    
    return {
        "message": f"Converted {req.points_to_convert} local points to {web_points_granted} web points",
        "new_loyalty_points": user.loyalty_points,
        "new_internal_points_local": user.internal_points_local
    }
