from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime
from app.models.auth import User, UserRole
from app.models.inventory import IntercompanyTransaction, IntercompanyStatus
from .auth import get_current_user, check_role
from app.dependencies.company import get_current_company_id
from beanie import PydanticObjectId

router = APIRouter(prefix="/intercompany", tags=["Inter-company Settlements"])

@router.get("/pending")
async def get_pending_transactions(
    company_id: str = Depends(get_current_company_id),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """Obtiene ventas cruzadas que requieren liquidación (Jeef -> Dirogsa)"""
    # Buscamos transacciones donde la empresa actual (Dirogsa) le debe a otra (Jeef)
    # o viceversa. Para el panel de control, mostramos todo lo que involucre a la empresa actual.
    query = {
        "$or": [
            {"from_company_id": company_id},
            {"to_company_id": company_id}
        ],
        "status": IntercompanyStatus.PENDING
    }
    return await IntercompanyTransaction.find(query).sort("-date").to_list()

@router.post("/settle")
async def create_settlement_batch(
    transaction_ids: List[PydanticObjectId],
    company_id: str = Depends(get_current_company_id),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """
    Agrupa transacciones pendientes para revisión y posterior registro de factura SUNAT.
    """
    if not transaction_ids:
        raise HTTPException(status_code=400, detail="No se proporcionaron transacciones.")

    transactions = await IntercompanyTransaction.find({"_id": {"$in": transaction_ids}}).to_list()
    
    # Marcamos como REVIEW para que no aparezcan en la lista de pendientes generales
    for tx in transactions:
        tx.status = IntercompanyStatus.REVIEW
        await tx.save()
        
    return {"message": f"{len(transactions)} transacciones movidas a revisión.", "count": len(transactions)}

@router.post("/complete")
async def complete_settlement(
    transaction_ids: List[PydanticObjectId],
    sunat_number: str,
    company_id: str = Depends(get_current_company_id),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """
    Cierra las transacciones registrando el número de factura legal de la SUNAT.
    """
    transactions = await IntercompanyTransaction.find({"_id": {"$in": transaction_ids}}).to_list()
    
    for tx in transactions:
        tx.status = IntercompanyStatus.COMPLETED
        tx.settlement_id = sunat_number
        await tx.save()
        
    return {"message": "Liquidación completada exitosamente.", "sunat_number": sunat_number}
