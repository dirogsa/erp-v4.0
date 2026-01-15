from typing import List, Optional, Dict, Any
from datetime import datetime
from app.models.sales import SalesInvoice, SalesNote, NoteType, NoteReason, OrderItem
from app.models.inventory import DeliveryGuide, GuideType, GuideStatus, GuideItem, MovementType
from app.services import inventory_service
from app.exceptions.business_exceptions import NotFoundException, ValidationException
from app.schemas.common import PaginatedResponse

async def get_notes(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    type: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
) -> PaginatedResponse[SalesNote]:
    query = {}
    
    if search:
        query["$or"] = [
            {"note_number": {"$regex": search, "$options": "i"}},
            {"invoice_number": {"$regex": search, "$options": "i"}},
            {"customer_name": {"$regex": search, "$options": "i"}}
        ]
    
    if type:
        query["type"] = type
        
    if date_from or date_to:
        query["date"] = {}
        if date_from:
            query["date"]["$gte"] = datetime.fromisoformat(date_from)
        if date_to:
            query["date"]["$lte"] = datetime.fromisoformat(date_to)

    total = await SalesNote.find(query).count()
    items = await SalesNote.find(query).sort("-date").skip(skip).limit(limit).to_list()
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=skip // limit + 1,
        pages=(total + limit - 1) // limit,
        size=limit
    )

async def create_note(
    invoice_number: str,
    note_type: NoteType,
    reason: NoteReason,
    items: List[Dict[str, Any]],
    notes: Optional[str] = None
) -> SalesNote:
    # 1. Verify Invoice
    invoice = await SalesInvoice.find_one(SalesInvoice.invoice_number == invoice_number)
    if not invoice:
        raise NotFoundException("Invoice", invoice_number)
        
    # 2. Validate Items & Calculate Total
    note_items = []
    total_amount = 0.0
    
    for item_data in items:
        # Check if item existed in original invoice
        original_item = next((i for i in invoice.items if i.product_sku == item_data['product_sku']), None)
        if not original_item:
           raise ValidationException(f"Product {item_data['product_sku']} not found in original invoice")
           
        if item_data['quantity'] > original_item.quantity:
             raise ValidationException(f"Quantity for {item_data['product_sku']} cannot exceed original quantity ({original_item.quantity})")
             
        # Use price from original invoice or allow override? 
        # Usually Credit Note uses original price.
        unit_price = original_item.unit_price
        
        note_items.append(OrderItem(
            product_sku=item_data['product_sku'],
            quantity=item_data['quantity'],
            unit_price=unit_price
        ))
        
        total_amount += (item_data['quantity'] * unit_price)
        
    total_amount = round(total_amount, 3)

    # 3. Generate Note Number
    prefix = "NC" if note_type == NoteType.CREDIT else "ND"
    last_note = await SalesNote.find({"note_number": {"$regex": f"^{prefix}"}}).sort("-note_number").limit(1).to_list()
    
    if last_note and last_note[0].note_number:
        try:
            last_num = int(last_note[0].note_number.split('-')[1])
            new_num = last_num + 1
        except (IndexError, ValueError):
            new_num = 1
    else:
        new_num = 1
        
    note_number = f"{prefix}-{new_num:04d}"

    # 4. Handle Inventory Return (Only for Credit Note + RETURN)
    return_guide_id = None
    if note_type == NoteType.CREDIT and reason == NoteReason.RETURN:
        guide_number = f"GUIA-RET-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Create Delivery Guide for internal record
        guide_items = []
        for item in note_items:
             product = await inventory_service.get_product_by_sku(item.product_sku)
             guide_items.append(GuideItem(
                sku=item.product_sku,
                product_name=product.name,
                quantity=item.quantity,
                unit_cost=0 # Not relevant for return guide usually, or use avg cost
             ))

        guide = DeliveryGuide(
            guide_number=guide_number,
            guide_type=GuideType.RETURN, # Ensure this type exists or use equivalent
            status=GuideStatus.COMPLETED,
            invoice_id=note_number, # Reference the Note
            target="Almacén Principal", # Defaulting for now
            items=guide_items,
            notes=f"Retorno por Nota de Crédito {note_number}",
            created_by="System",
            completed_date=datetime.now()
        )
        await guide.insert()
        return_guide_id = str(guide.id)
        
        # Move Stock IN
        for item in note_items:
            await inventory_service.register_movement(
                sku=item.product_sku,
                quantity=item.quantity,
                movement_type=MovementType.IN,
                reference=guide_number
            )

    # 5. Create Note
    note = SalesNote(
        note_number=note_number,
        invoice_number=invoice.invoice_number,
        customer_name=invoice.customer_name,
        customer_ruc=invoice.customer_ruc,
        type=note_type,
        reason=reason,
        items=note_items,
        total_amount=total_amount,
        notes=notes,
        return_guide_id=return_guide_id
    )
    
    await note.insert()

    # 6. Link Note to Invoice for visibility
    if not hasattr(invoice, 'linked_notes') or invoice.linked_notes is None:
        invoice.linked_notes = []
    
    invoice.linked_notes.append({
        "note_number": note.note_number,
        "type": note_type,
        "total_amount": total_amount,
        "date": note.date.isoformat()
    })
    await invoice.save()

    return note
