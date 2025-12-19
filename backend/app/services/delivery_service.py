from typing import Optional, List
from datetime import datetime
from app.models.inventory import (
    DeliveryGuide, GuideStatus, GuideType, GuideItem,
    Product, StockMovement, MovementType
)
from app.exceptions.business_exceptions import NotFoundException, ValidationException
from app.schemas.common import PaginatedResponse


async def get_guides(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    status: Optional[str] = None,
    guide_type: Optional[str] = None
) -> PaginatedResponse[DeliveryGuide]:
    query = {}
    
    if search:
        query["$or"] = [
            {"guide_number": {"$regex": search, "$options": "i"}},
            {"sunat_number": {"$regex": search, "$options": "i"}},
            {"customer_name": {"$regex": search, "$options": "i"}},
            {"invoice_number": {"$regex": search, "$options": "i"}}
        ]
    
    if status:
        query["status"] = status
        
    if guide_type:
        query["guide_type"] = guide_type

    total = await DeliveryGuide.find(query).count()
    items = await DeliveryGuide.find(query).sort("-issue_date").skip(skip).limit(limit).to_list()
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=skip // limit + 1,
        pages=(total + limit - 1) // limit,
        size=limit
    )


async def get_guide(guide_number: str) -> DeliveryGuide:
    guide = await DeliveryGuide.find_one(DeliveryGuide.guide_number == guide_number)
    if not guide:
        raise NotFoundException("Guide", guide_number)
    return guide


async def create_guide_from_invoice(
    invoice_number: str,
    sunat_number: Optional[str] = None,
    vehicle_plate: Optional[str] = None,
    driver_name: Optional[str] = None,
    notes: Optional[str] = None,
    created_by: Optional[str] = None
) -> DeliveryGuide:
    """Crear guía de despacho a partir de una factura"""
    from app.models.sales import SalesInvoice
    
    # Buscar factura
    invoice = await SalesInvoice.find_one(SalesInvoice.invoice_number == invoice_number)
    if not invoice:
        raise NotFoundException("Invoice", invoice_number)
    
    # Verificar que no tenga guía ya
    existing = await DeliveryGuide.find_one(DeliveryGuide.invoice_number == invoice_number)
    if existing:
        # Si ya existe, nos aseguramos que esté vinculada en la factura y la devolvemos
        if not invoice.guide_id:
            invoice.guide_id = existing.guide_number
            await invoice.save()
        return existing
    
    # Generar número interno consecutivo
    # Generar número interno consecutivo: GV-YY-####
    year_prefix = datetime.now().strftime('%y')
    prefix = f"GV-{year_prefix}"
    
    last_guide = await DeliveryGuide.find({"guide_number": {"$regex": f"^{prefix}"}}).sort("-guide_number").limit(1).to_list()
    if last_guide and last_guide[0].guide_number:
        try:
            parts = last_guide[0].guide_number.split('-')
            if len(parts) == 3:
                last_num = int(parts[2])
                new_num = last_num + 1
            else:
                new_num = 1
        except (IndexError, ValueError):
            new_num = 1
    else:
        new_num = 1
    
    guide_number = f"{prefix}-{new_num:04d}"
    
    # Crear items de la guía
    guide_items = []
    for item in invoice.items:
        product = await Product.find_one(Product.sku == item.product_sku)
        guide_items.append(GuideItem(
            sku=item.product_sku,
            product_name=product.name if product else "Producto desconocido",
            quantity=item.quantity,
            unit_cost=product.cost if product else 0
        ))
    
    guide = DeliveryGuide(
        guide_number=guide_number,
        sunat_number=sunat_number,
        guide_type=GuideType.DISPATCH,
        status=GuideStatus.DRAFT,
        invoice_number=invoice_number,
        order_number=invoice.order_number,
        customer_name=invoice.customer_name,
        customer_ruc=invoice.customer_ruc,
        delivery_address=invoice.delivery_address,
        items=guide_items,
        vehicle_plate=vehicle_plate,
        driver_name=driver_name,
        notes=notes,
        created_by=created_by,
        issue_date=datetime.now()
    )
    
    await guide.insert()

    # Link guide to invoice immediately
    invoice.guide_id = guide.guide_number
    await invoice.save()

    return guide


async def dispatch_guide(guide_number: str) -> DeliveryGuide:
    """Marcar guía como despachada y descontar stock"""
    guide = await get_guide(guide_number)
    
    if guide.status != GuideStatus.DRAFT:
        raise ValidationException(f"Guide must be in DRAFT status to dispatch (current: {guide.status})")
    
    # Descontar stock de cada item
    for item in guide.items:
        product = await Product.find_one(Product.sku == item.sku)
        if not product:
            raise NotFoundException("Product", item.sku)
        
        if product.stock_current < item.quantity:
            raise ValidationException(f"Insufficient stock for {item.sku}: available {product.stock_current}, required {item.quantity}")
        
        # Registrar movimiento de salida
        movement = StockMovement(
            product_sku=item.sku,
            quantity=item.quantity,
            movement_type=MovementType.OUT,
            reference_document=guide.guide_number,
            unit_cost=item.unit_cost,
            notes=f"Despacho guía {guide.guide_number}",
            date=datetime.now()
        )
        await movement.insert()
        
        # Actualizar stock
        product.stock_current -= item.quantity
        await product.save()
    
    # Actualizar estado de la guía
    guide.status = GuideStatus.DISPATCHED
    guide.dispatch_date = datetime.now()
    await guide.save()

    # Actualizar factura asociada
    if guide.invoice_number:
        from app.models.sales import SalesInvoice
        invoice = await SalesInvoice.find_one(SalesInvoice.invoice_number == guide.invoice_number)
        if invoice:
            invoice.dispatch_status = "DISPATCHED"
            invoice.guide_id = guide.guide_number
            await invoice.save()
    
    return guide


async def deliver_guide(guide_number: str, received_by: Optional[str] = None) -> DeliveryGuide:
    """Confirmar entrega de la guía"""
    guide = await get_guide(guide_number)
    
    if guide.status != GuideStatus.DISPATCHED:
        raise ValidationException(f"Guide must be DISPATCHED to mark as delivered (current: {guide.status})")
    
    guide.status = GuideStatus.DELIVERED
    guide.delivery_date = datetime.now()
    guide.received_by = received_by
    await guide.save()

    # Actualizar factura asociada
    if guide.invoice_number:
        from app.models.sales import SalesInvoice
        invoice = await SalesInvoice.find_one(SalesInvoice.invoice_number == guide.invoice_number)
        if invoice:
            invoice.dispatch_status = "DELIVERED"
            await invoice.save()
    
    return guide


async def cancel_guide(guide_number: str) -> DeliveryGuide:
    """Anular guía y devolver stock si fue despachada"""
    guide = await get_guide(guide_number)
    
    if guide.status == GuideStatus.CANCELLED:
        # If already cancelled, we just want to ensure it is deleted (cleanup)
        pass
    
    # Si fue despachada, devolver stock
    if guide.status in [GuideStatus.DISPATCHED, GuideStatus.DELIVERED]:
        for item in guide.items:
            product = await Product.find_one(Product.sku == item.sku)
            if product:
                # Registrar movimiento de entrada (devolución)
                movement = StockMovement(
                    product_sku=item.sku,
                    quantity=item.quantity,
                    movement_type=MovementType.IN,
                    reference_document=f"CANCEL-{guide.guide_number}",
                    unit_cost=item.unit_cost,
                    notes=f"Anulación guía {guide.guide_number}",
                    date=datetime.now()
                )
                await movement.insert()
                
                # Devolver stock
                product.stock_current += item.quantity
                await product.save()
    
    # Actualizar factura asociada
    if guide.invoice_number:
        from app.models.sales import SalesInvoice
        # Use find_one to avoid errors if invoice deleted
        invoice = await SalesInvoice.find_one(SalesInvoice.invoice_number == guide.invoice_number)
        if invoice:
            invoice.dispatch_status = "NOT_DISPATCHED"
            invoice.guide_id = None
            await invoice.save()

    # User Request: Delete the guide instead of keeping it as CANCELLED
    await guide.delete()
    
    return guide
