from typing import List, Optional
from ..models.staff import Staff
from beanie.operators import RegEx

class StaffService:
    @staticmethod
    async def get_all_staff(
        skip: int = 0, 
        limit: int = 50, 
        search: str = None, 
        department: str = None,
        active_only: bool = False
    ) -> List[Staff]:
        query = {}
        if search:
            query["full_name"] = RegEx(search, "i")
        if department:
            query["department"] = department
        if active_only:
            query["is_active"] = True
            
        return await Staff.find(query).skip(skip).limit(limit).to_list()

    @staticmethod
    async def get_staff_member(staff_id: str) -> Optional[Staff]:
        return await Staff.get(staff_id)

    @staticmethod
    async def create_staff(staff_data: dict) -> Staff:
        staff = Staff(**staff_data)
        await staff.insert()
        return staff

    @staticmethod
    async def update_staff(staff_id: str, update_data: dict) -> Optional[Staff]:
        staff = await Staff.get(staff_id)
        if not staff:
            return None
            
        # Filter out None values
        update_filtered = {k: v for k, v in update_data.items() if v is not None}
        
        await staff.set(update_filtered)
        return staff

    @staticmethod
    async def delete_staff(staff_id: str) -> bool:
        staff = await Staff.get(staff_id)
        if not staff:
            return False
        await staff.delete()
        return True
