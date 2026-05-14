from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.models.config import SystemConfig
from app.models.auth import User, UserRole
from app.routes.auth import check_role
from pydantic import BaseModel
from beanie import PydanticObjectId

router = APIRouter(prefix="/marketing", tags=["Marketing"])

class PointsConversionRequest(BaseModel):
    user_id: str
    points_to_convert: int

@router.post("/loyalty/convert-points")
async def convert_points(
    req: PointsConversionRequest,
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """
    World-Class Points Conversion Engine.
    Converts internal/local points to public web shop points based on sovereign rate.
    """
    user = await User.get(PydanticObjectId(req.user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    config = await SystemConfig.find_one({})
    rate = config.loyalty.local_to_web_rate if config else 1.0
    
    if (user.internal_points_local or 0) < req.points_to_convert:
        raise HTTPException(status_code=400, detail="Puntos locales insuficientes")
    
    # Calculate web points to grant
    web_points_granted = int(req.points_to_convert * rate)
    
    # Atomic update
    user.internal_points_local = (user.internal_points_local or 0) - req.points_to_convert
    user.loyalty_points = (user.loyalty_points or 0) + web_points_granted
    
    await user.save()
    
    return {
        "message": f"Convertidos {req.points_to_convert} puntos locales a {web_points_granted} puntos web",
        "new_loyalty_points": user.loyalty_points,
        "new_internal_points_local": user.internal_points_local,
        "conversion_rate": rate
    }
