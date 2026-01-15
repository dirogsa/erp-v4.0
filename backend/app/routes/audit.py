from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from ..models.auth import User, UserRole, ActivityLog
from ..services.audit_service import AuditService
from .auth import check_role

router = APIRouter(prefix="/audit", tags=["Audit Logs"])

@router.get("/logs")
async def get_activity_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    module: Optional[str] = None,
    user_id: Optional[str] = None,
    current_user: User = Depends(check_role([UserRole.SUPERADMIN]))
):
    logs, total = await AuditService.get_logs(skip, limit, module, user_id)
    return {
        "items": logs,
        "total": total,
        "pages": (total + limit - 1) // limit,
        "page": (skip // limit) + 1,
        "size": limit
    }

@router.delete("/logs")
async def delete_logs(
    log_ids: List[str],
    current_user: User = Depends(check_role([UserRole.SUPERADMIN]))
):
    await AuditService.delete_logs(log_ids)
    return {"message": f"Se eliminaron {len(log_ids)} registros"}

@router.delete("/purge")
async def purge_logs(
    days: int = Query(30, ge=0),
    module: Optional[str] = None,
    current_user: User = Depends(check_role([UserRole.SUPERADMIN]))
):
    await AuditService.purge_logs(days, module)
    msg = f"Se eliminaron los registros anteriores a {days} días"
    if module:
        msg += f" del módulo {module}"
    return {"message": msg}
