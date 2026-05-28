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

class LoyaltyConfigUpdate(BaseModel):
    points_per_currency_unit: float
    is_active: bool
    only_web_accumulation: bool
    local_to_web_rate: float

@router.get("/loyalty/config")
async def get_loyalty_config(current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))):
    """Obtiene la configuración del programa de lealtad"""
    config = await SystemConfig.find_one({})
    if not config:
        config = SystemConfig()
        await config.insert()
    return config.loyalty

@router.put("/loyalty/config")
async def update_loyalty_config(
    payload: LoyaltyConfigUpdate,
    current_user: User = Depends(check_role([UserRole.SUPERADMIN]))
):
    """Actualiza la configuración del programa de lealtad (Solo SuperAdmin)"""
    config = await SystemConfig.find_one({})
    if not config:
        config = SystemConfig()
    
    config.loyalty.points_per_currency_unit = payload.points_per_currency_unit
    config.loyalty.is_active = payload.is_active
    config.loyalty.only_web_accumulation = payload.only_web_accumulation
    config.loyalty.local_to_web_rate = payload.local_to_web_rate
    
    await config.save()
    return config.loyalty

# --- REVIEWS MANAGEMENT ---

@router.get("/reviews")
async def get_all_reviews(
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    from app.models.inventory import ProductReview
    # Devuelve pendientes primero
    reviews = await ProductReview.find_all().sort([("is_approved", 1), ("-created_at", 1)]).to_list()
    return reviews

@router.patch("/reviews/{review_id}/approve")
async def approve_review(
    review_id: str,
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    from app.models.inventory import ProductReview
    review = await ProductReview.get(PydanticObjectId(review_id))
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    review.is_approved = True
    await review.save()
    return {"message": "Reseña aprobada con éxito"}

@router.delete("/reviews/{review_id}")
async def delete_review(
    review_id: str,
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    from app.models.inventory import ProductReview
    review = await ProductReview.get(PydanticObjectId(review_id))
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    await review.delete()
    return {"message": "Reseña eliminada"}
