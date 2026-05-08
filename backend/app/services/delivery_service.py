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

    print(f"DEBUG [GET_GUIDES]: Ejecutando búsqueda con query={query}, skip={skip}, limit={limit}")
    total = await DeliveryGuide.find(query).count()
    items = await DeliveryGuide.find(query).sort("-issue_date").skip(skip).limit(limit).to_list()
    print(f"DEBUG [GET_GUIDES]: Se encontraron {total} guías. Retornando {len(items)} items en esta página.")
    
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
        company_id=invoice.company_id,
        issue_date=datetime.now()
    )
    
    await guide.insert()

    # Link guide to invoice immediately
    invoice.guide_id = guide.guide_number
    await invoice.save()

    return guide


async def prepare_guide(guide_number: str, company_id: Optional[str] = None) -> DeliveryGuide:
    """Marcar guía como LISTA (Empaquetada) - Sin movimiento de stock todavía"""
    guide = await get_guide(guide_number)
    
    if guide.status != GuideStatus.DRAFT:
        raise ValidationException(f"La guía debe estar en BORRADOR para marcarla como LISTA (actual: {guide.status})")
    
    guide.status = GuideStatus.READY
    await guide.save()
    
    # Actualizar factura si existe
    if guide.invoice_number and guide.guide_type == GuideType.DISPATCH:
        from app.models.sales import SalesInvoice
        await SalesInvoice.find(SalesInvoice.invoice_number == guide.invoice_number).update({"$set": {"dispatch_status": "READY"}})
        
    return guide


async def dispatch_guide(guide_number: str, company_id: Optional[str] = None) -> DeliveryGuide:
    """Marcar guía como DESPACHADA (Salió del almacén) y descontar stock"""
    guide = await get_guide(guide_number)
    from app.services import inventory_service
    
    if guide.status not in [GuideStatus.DRAFT, GuideStatus.READY]:
        raise ValidationException(f"La guía debe estar en BORRADOR o LISTA para despachar (actual: {guide.status})")
    
    # Descontar stock de cada item
    for item in guide.items:
        product = await inventory_service.find_product_robustly(item.sku, company_id=company_id)
        if not product:
            raise NotFoundException("Product", item.sku)
        
        # Determinar dirección del movimiento
        m_type = MovementType.OUT if guide.guide_type == GuideType.DISPATCH else MovementType.IN
        
        # Registrar movimiento usando el servicio centralizado
        # (El servicio ya maneja la validación de stock según la configuración allow_negative_stock)
        await inventory_service.register_movement(
            sku=item.sku,
            quantity=item.quantity,
            movement_type=m_type,
            reference=guide.guide_number,
            unit_cost=item.unit_cost,
            company_id=company_id or getattr(guide, 'company_id', None),
            product_id=product.id
        )
    
    # Actualizar estado de la guía
    guide.status = GuideStatus.DISPATCHED
    guide.dispatch_date = datetime.now()
    await guide.save()

    # Actualizar factura asociada
    if guide.invoice_number:
        if guide.guide_type == GuideType.DISPATCH:
            from app.models.sales import SalesInvoice
            invoice = await SalesInvoice.find_one(SalesInvoice.invoice_number == guide.invoice_number)
            if invoice:
                invoice.dispatch_status = "DISPATCHED"
                invoice.guide_id = guide.guide_number
                await invoice.save()
        elif guide.guide_type == GuideType.RECEPTION:
            from app.models.purchasing import PurchaseInvoice
            p_invoice = await PurchaseInvoice.find_one(PurchaseInvoice.invoice_number == guide.invoice_number)
            if p_invoice:
                p_invoice.reception_status = "IN_TRANSIT"
                p_invoice.guide_id = guide.guide_number
                await p_invoice.save()
    
    return guide


async def deliver_guide(guide_number: str, received_by: Optional[str] = None, company_id: Optional[str] = None) -> DeliveryGuide:
    """Confirmar entrega de la guía"""
    guide = await get_guide(guide_number)
    
    # Context fallback
    effective_company_id = company_id or getattr(guide, 'company_id', None)

    
    # REQUISITO PREMIUM: Si es RECEPTION y se marca como DELIVERED, 
    # y NO se había despachado antes (stock no movido), lo movemos ahora.
    # (Caso donde el usuario salta 'dispatch' y va directo a 'deliver')
    old_status = guide.status
    
    guide.status = GuideStatus.DELIVERED
    guide.delivery_date = datetime.now()
    guide.received_by = received_by
    await guide.save()

    # Actualizar factura asociada
    if guide.invoice_number:
        if guide.guide_type == GuideType.DISPATCH:
            from app.models.sales import SalesInvoice
            invoice = await SalesInvoice.find_one(SalesInvoice.invoice_number == guide.invoice_number)
            if invoice:
                invoice.dispatch_status = "DELIVERED"
                await invoice.save()
        elif guide.guide_type == GuideType.RECEPTION:
            from app.models.purchasing import PurchaseInvoice
            p_invoice = await PurchaseInvoice.find_one(PurchaseInvoice.invoice_number == guide.invoice_number)
            if p_invoice:
                p_invoice.reception_status = "RECEIVED"
                await p_invoice.save()
                
                if old_status != GuideStatus.DISPATCHED:
                    from app.services import inventory_service
                    for item in guide.items:
                        # Use robust finding to ensure we get the right product context
                        product = await inventory_service.find_product_robustly(item.sku, company_id=effective_company_id)
                        if product:
                            await inventory_service.register_movement(
                                sku=item.sku,
                                quantity=item.quantity,
                                movement_type=MovementType.IN,
                                reference=guide.guide_number,
                                unit_cost=item.unit_cost,
                                company_id=effective_company_id,
                                product_id=product.id
                            )
    
    return guide


async def cancel_guide(guide_number: str, company_id: Optional[str] = None, revert_to_draft: bool = False) -> DeliveryGuide:
    """
    Anular o Revertir guía (Ingeniería de Clase Mundial)
    - Si revert_to_draft=True: La guía vuelve a DRAFT para edición.
    - Si revert_to_draft=False: La guía queda como CANCELLED (Auditoría).
    """
    guide = await get_guide(guide_number)
    from app.services import inventory_service
    
    # Context fallback
    effective_company_id = company_id or getattr(guide, 'company_id', None)
    
    # 1. Devolución de Stock (Solo si estaba movido)
    if guide.status in [GuideStatus.DISPATCHED, GuideStatus.DELIVERED]:
        for item in guide.items:
            product = await inventory_service.find_product_robustly(item.sku, company_id=effective_company_id)
            if product:
                await inventory_service.register_movement(
                    sku=item.sku,
                    quantity=item.quantity,
                    movement_type=MovementType.IN,
                    reference=f"REVERT-{guide.guide_number}",
                    unit_cost=item.unit_cost,
                    company_id=effective_company_id,
                    product_id=product.id
                )
    
    # 2. Restauración de Facturas vinculadas
    if guide.invoice_number:
        from app.models.sales import SalesInvoice
        # Actualización masiva de seguridad por número y por ID
        await SalesInvoice.find(
            (SalesInvoice.invoice_number == guide.invoice_number) | (SalesInvoice.guide_id == guide.guide_number)
        ).update({"$set": {"dispatch_status": "NOT_DISPATCHED", "guide_id": None}})
    
    # 3. Gestión de Estado (Audit-Safe)
    if revert_to_draft:
        guide.status = GuideStatus.DRAFT
        # Limpiamos fechas de proceso para permitir re-despacho
        guide.delivery_date = None
        await guide.save()
    else:
        # Si ya es DRAFT y se anula, sí podríamos borrarla o marcarla
        if guide.status == GuideStatus.DRAFT:
             await guide.delete() # Borrado físico solo si nunca salió de borrador
             return None
        else:
            guide.status = GuideStatus.CANCELLED
            await guide.save()
    
    return guide


async def bulk_dispatch_guides(guide_numbers: List[str], company_id: Optional[str] = None) -> dict:
    """Procesar despacho masivo de guías"""
    success_count = 0
    errors = []
    
    print(f"DEBUG [BULK_DISPATCH]: Iniciando despacho masivo para {len(guide_numbers)} guías: {guide_numbers}")
    
    for num in guide_numbers:
        try:
            await dispatch_guide(num, company_id)
            success_count += 1
            print(f"DEBUG [BULK_DISPATCH]: Guía {num} despachada con éxito.")
        except Exception as e:
            print(f"ERROR [BULK_DISPATCH]: Falló despacho de guía {num}: {str(e)}")
            errors.append({"guide": num, "error": str(e)})
            
    message = f"Se despacharon {success_count} guías correctamente."
    if errors:
        message += f" ({len(errors)} errores detectados)"
        
    return {
        "message": message,
        "success_count": success_count,
        "error_count": len(errors),
        "errors": errors
    }


async def bulk_deliver_guides(guide_numbers: List[str], received_by: Optional[str] = None, company_id: Optional[str] = None) -> dict:
    """Confirmar entrega masiva de guías"""
    success_count = 0
    errors = []
    
    for num in guide_numbers:
        try:
            await deliver_guide(num, received_by, company_id=company_id)
            success_count += 1
        except Exception as e:
            errors.append({"guide": num, "error": str(e)})
            
    return {
        "message": f"Se confirmaron {success_count} entregas correctamente.",
        "success_count": success_count,
        "error_count": len(errors),
        "errors": errors
    }


async def bulk_prepare_guides(guide_numbers: List[str], company_id: Optional[str] = None) -> dict:
    """Preparar masivamente guías (DRAFT -> READY)"""
    success_count = 0
    errors = []
    
    for num in guide_numbers:
        try:
            await prepare_guide(num, company_id=company_id)
            success_count += 1
        except Exception as e:
            errors.append({"guide": num, "error": str(e)})
            
    return {
        "message": f"Se prepararon {success_count} guías correctamente.",
        "success_count": success_count,
        "error_count": len(errors),
        "errors": errors
    }


async def bulk_delete_guides(guide_numbers: List[str], company_id: Optional[str] = None, revert_to_draft: bool = False) -> dict:
    """Anular o Revertir masivamente guías"""
    success_count = 0
    errors = []
    
    for num in guide_numbers:
        try:
            await cancel_guide(num, company_id=company_id, revert_to_draft=revert_to_draft)
            success_count += 1
        except Exception as e:
            errors.append({"guide": num, "error": str(e)})
            
    verb = "revirtieron (a borrador)" if revert_to_draft else "anularon"
    return {
        "message": f"Se {verb} {success_count} guías correctamente.",
        "success_count": success_count,
        "error_count": len(errors),
        "errors": errors
    }
