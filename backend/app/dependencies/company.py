from fastapi import Depends, HTTPException, Header, status
from app.models.auth import User
from app.routes.auth import get_current_user
from typing import Optional

async def get_current_company_id(
    current_user: User = Depends(get_current_user),
    x_company_id: Optional[str] = Header(None)
) -> str:
    """
    World-class company context resolver.
    Prioritizes the header 'X-Company-ID', fallback to user's selected_company_id.
    """
    company_id = x_company_id or current_user.current_company_id
    
    if not company_id:
        # If the user only has one company, use that one
        if len(current_user.assigned_companies) == 1:
            company_id = current_user.assigned_companies[0]
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No company context selected. Please provide X-Company-ID header or select a company."
            )
            
    # Security check: Ensure user is assigned to this company
    # Skip check for SUPERADMIN if needed, but for now we enforce it.
    if company_id not in current_user.assigned_companies and current_user.role != "SUPERADMIN":
         raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied for this company."
            )
            
    return company_id
