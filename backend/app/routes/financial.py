from fastapi import APIRouter, HTTPException, Query, Body
from typing import List, Optional
from app.models.sales import SalesNote, NoteType, NoteReason
from app.services import financial_service
from app.schemas.common import PaginatedResponse
from app.exceptions.business_exceptions import BusinessException
from pydantic import BaseModel

router = APIRouter(prefix="/sales", tags=["Financial"])

class CreateNoteRequest(BaseModel):
    items: List[dict]
    reason: NoteReason
    notes: Optional[str] = None

@router.get("/notes", response_model=PaginatedResponse[SalesNote])
async def get_notes(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    type: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
):
    # Convert empty strings to None
    search = search if search else None
    type = type if type else None
    date_from = date_from if date_from else None
    date_to = date_to if date_to else None
    return await financial_service.get_notes(skip, limit, search, type, date_from, date_to)

@router.post("/invoices/{invoice_number}/notes", response_model=SalesNote)
async def create_note(
    invoice_number: str,
    type: NoteType = Query(..., description="CREDIT or DEBIT"),
    request: CreateNoteRequest = Body(...)
):
    try:
        return await financial_service.create_note(
            invoice_number=invoice_number,
            note_type=type,
            reason=request.reason,
            items=request.items,
            notes=request.notes
        )
    except BusinessException as e:
        raise HTTPException(status_code=400, detail=str(e))
