from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List
from ..models.staff import Staff, StaffCreate, StaffUpdate
from ..services.staff_service import StaffService
from ..routes.auth import check_role
from ..models.auth import UserRole

router = APIRouter(prefix="/staff", tags=["Staff Management"])

@router.get("", response_model=List[Staff])
async def get_staff_list(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: str = None,
    department: str = None,
    active_only: bool = False
):
    return await StaffService.get_all_staff(skip, limit, search, department, active_only)

@router.post("", response_model=Staff)
async def create_staff_member(
    staff_in: StaffCreate,
    current_user = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    return await StaffService.create_staff(staff_in.dict())

@router.get("/{staff_id}", response_model=Staff)
async def get_staff_member(staff_id: str):
    staff = await StaffService.get_staff_member(staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return staff

@router.put("/{staff_id}", response_model=Staff)
async def update_staff_member(
    staff_id: str,
    staff_update: StaffUpdate,
    current_user = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    staff = await StaffService.update_staff(staff_id, staff_update.dict())
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return staff

@router.delete("/{staff_id}")
async def delete_staff_member(
    staff_id: str,
    current_user = Depends(check_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    success = await StaffService.delete_staff(staff_id)
    if not success:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return {"message": "Staff member deleted successfully"}
