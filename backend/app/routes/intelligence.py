from fastapi import APIRouter, Depends, Query
from typing import List, Dict, Any, Optional
from app.services.intelligence_service import IntelligenceService
from app.routes.auth import get_current_user, check_role
from app.models.auth import User, UserRole

router = APIRouter(prefix="/intelligence", tags=["Intelligence & Analytics"])

@router.get("/import-planning")
async def get_import_planning(
    company_id: Optional[str] = None,
    lead_time_days: int = Query(60, ge=1, le=180),
    service_level: float = Query(0.95, ge=0.90, le=0.99),
    analysis_days: int = Query(180, ge=30, le=730),
    recent_days: int = Query(30, ge=7, le=90),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """
    Retorna el plan de importación sugerido basado en algoritmos predictivos.
    Permite ajustar parámetros de suministro y ventanas de tendencia dinámicamente.
    """
    return await IntelligenceService.get_import_planning(
        company_id=company_id,
        lead_time_days=lead_time_days,
        service_level=service_level,
        analysis_days=analysis_days,
        recent_days=recent_days
    )
