from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from beanie import PydanticObjectId
from app.models.purchasing import PurchaseOrder, PurchaseInvoice, Supplier, PaymentStatus, OrderStatus, Payment, PurchaseQuote, QuoteStatus
from app.models.inventory import DeliveryGuide, GuideType, GuideStatus, GuideItem, MovementType, Product
from app.models.company import Company
from app.services import inventory_service
from app.exceptions.business_exceptions import NotFoundException, ValidationException, DuplicateEntityException
from app.schemas.common import PaginatedResponse


# ==================== QUOTES ====================

async def get_quotes(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    company_id: Optional[str] = None
) -> PaginatedResponse[PurchaseQuote]:
    query = {}
    if company_id:
        query["company_id"] = company_id
    
    if search:
        query["$or"] = [
            {"quote_number": {"$regex": search, "$options": "i"}},
            {"supplier_name": {"$regex": search, "$options": "i"}}
        ]
    
    if status:
        query["status"] = status
        
    if date_from or date_to:
        query["date"] = {}
        if date_from:
            query["date"]["$gte"] = datetime.fromisoformat(date_from)
        if date_to:
            query["date"]["$lte"] = datetime.fromisoformat(date_to)

    total = await PurchaseQuote.find(query).count()
    items = await PurchaseQuote.find(query).sort("-date").skip(skip).limit(limit).to_list()
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=skip // limit + 1,
        pages=(total + limit - 1) // limit,
        size=limit
    )

async def get_quote(quote_number: str) -> PurchaseQuote:
    quote = await PurchaseQuote.find_one(PurchaseQuote.quote_number == quote_number)
    if not quote:
        raise NotFoundException("Quote", quote_number)
    return quote

async def create_quote(quote: PurchaseQuote) -> PurchaseQuote:

    # Generate Sequential Quote Number: CC-YY-####
    year_prefix = datetime.now().strftime('%y')
    prefix = f"CC-{year_prefix}"
    
    last_quote = await PurchaseQuote.find({"quote_number": {"$regex": f"^{prefix}"}}).sort("-quote_number").limit(1).to_list()
    
    if last_quote and last_quote[0].quote_number:
        try:
            parts = last_quote[0].quote_number.split('-')
            if len(parts) == 3:
                last_num = int(parts[2])
                new_num = last_num + 1
            else:
                new_num = 1
        except (IndexError, ValueError):
            new_num = 1
    else:
        new_num = 1
    
    quote.quote_number = f"{prefix}-{new_num:04d}"
    quote.total_amount = round(sum(item.quantity * item.unit_cost for item in quote.items), 3)
    quote.status = QuoteStatus.DRAFT
    
    await quote.insert()
    return quote

async def update_quote(quote_number: str, quote_data: PurchaseQuote) -> PurchaseQuote:
    quote = await get_quote(quote_number)
    
    if quote.status in [QuoteStatus.ACCEPTED, QuoteStatus.CONVERTED, QuoteStatus.REJECTED]:
        raise ValidationException("Cannot update a finalized quote")
    
    quote.supplier_name = quote_data.supplier_name
    quote.items = quote_data.items
    quote.valid_until = quote_data.valid_until
    quote.notes = quote_data.notes
    quote.total_amount = round(sum(item.quantity * item.unit_cost for item in quote_data.items), 3)
    
    await quote.save()
    return quote

async def delete_quote(quote_number: str) -> bool:
    quote = await get_quote(quote_number)
    
    if quote.status == QuoteStatus.CONVERTED:
        raise ValidationException("Cannot delete a converted quote")
        
    await quote.delete()
    return True

async def convert_quote_to_order(quote_number: str) -> Dict[str, Any]:
    quote = await get_quote(quote_number)
    
    if quote.status == QuoteStatus.CONVERTED:
        raise ValidationException("Quote already converted")
        
    order = PurchaseOrder(
        supplier_name=quote.supplier_name,
        items=quote.items,
        status=OrderStatus.PENDING,
        total_amount=quote.total_amount,
        amount_in_words=quote.amount_in_words
    )
    
    saved_order = await create_order(order)
    
    quote.status = QuoteStatus.CONVERTED
    await quote.save()
    
    return {
        "message": "Quote converted successfully",
        "order_number": saved_order.order_number
    }

# ==================== ORDERS ====================

async def get_orders(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    company_id: Optional[str] = None
) -> PaginatedResponse[PurchaseOrder]:
    query = {}
    if company_id:
        query["company_id"] = company_id
    
    if search:
        query["$or"] = [
            {"order_number": {"$regex": search, "$options": "i"}},
            {"supplier_name": {"$regex": search, "$options": "i"}}
        ]
    
    if status:
        query["status"] = status
        
    if date_from or date_to:
        query["date"] = {}
        if date_from:
            query["date"]["$gte"] = datetime.fromisoformat(date_from)
        if date_to:
            query["date"]["$lte"] = datetime.fromisoformat(date_to)

    total = await PurchaseOrder.find(query).count()
    items = await PurchaseOrder.find(query).sort("-date").skip(skip).limit(limit).to_list()
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=skip // limit + 1,
        pages=(total + limit - 1) // limit,
        size=limit
    )

async def create_order(order: PurchaseOrder) -> PurchaseOrder:
    # Generate Sequential Order Number: OC-YY-####
    year_prefix = datetime.now().strftime('%y')
    prefix = f"OC-{year_prefix}"
    
    last_order = await PurchaseOrder.find({"order_number": {"$regex": f"^{prefix}"}}).sort("-order_number").limit(1).to_list()
    
    if last_order and last_order[0].order_number:
        try:
            parts = last_order[0].order_number.split('-')
            if len(parts) == 3:
                last_num = int(parts[2])
                new_num = last_num + 1
            else:
                new_num = 1
        except (IndexError, ValueError):
            new_num = 1
    else:
        new_num = 1
    
    order.order_number = f"{prefix}-{new_num:04d}"
    order.total_amount = round(sum(item.quantity * item.unit_cost for item in order.items), 3)
    
    await order.insert()
    return order

# ==================== INVOICES ====================

async def get_invoices(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    payment_status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    is_confirmed: Optional[bool] = None,
    company_id: Optional[str] = None
) -> PaginatedResponse[PurchaseInvoice]:
    query = {}
    if company_id:
        query["company_id"] = company_id
    
    if search:
        query["$or"] = [
            {"invoice_number": {"$regex": search, "$options": "i"}},
            {"supplier_name": {"$regex": search, "$options": "i"}},
            {"order_number": {"$regex": search, "$options": "i"}}
        ]
    
    if payment_status:
        query["payment_status"] = payment_status
        
    if is_confirmed is not None:
        query["is_financial_confirmed"] = is_confirmed
        
    if date_from or date_to:
        query["invoice_date"] = {}
        if date_from:
            query["invoice_date"]["$gte"] = datetime.fromisoformat(date_from)
        if date_to:
            query["invoice_date"]["$lte"] = datetime.fromisoformat(date_to)

    total = await PurchaseInvoice.find(query).count()
    items = await PurchaseInvoice.find(query).sort("-invoice_date").skip(skip).limit(limit).to_list()
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=skip // limit + 1,
        pages=(total + limit - 1) // limit,
        size=limit
    )

async def get_invoice(invoice_number: str) -> PurchaseInvoice:
    invoice = await PurchaseInvoice.find_one(PurchaseInvoice.invoice_number == invoice_number)
    if not invoice:
        invoice = await PurchaseInvoice.find_one(PurchaseInvoice.sunat_number == invoice_number)
    if not invoice:
        raise NotFoundException("Invoice", invoice_number)
    return invoice

async def create_invoice(
    order_number: str, 
    sunat_number: Optional[str] = None, # Número del proveedor
    invoice_date: str = None, 
    payment_status: PaymentStatus = PaymentStatus.PENDING,
    amount_paid: float = 0.0,
    payment_date: Optional[str] = None,
    company_id: Optional[str] = None
) -> PurchaseInvoice:
    
    order = await PurchaseOrder.find_one(PurchaseOrder.order_number == order_number)
    if not order:
        raise NotFoundException("Order", order_number)
    
    if order.status == OrderStatus.INVOICED:
        raise ValidationException("Order already invoiced")
    
    if amount_paid > order.total_amount:
        raise ValidationException("Amount paid cannot exceed total amount")
    
    # Generate Internal ID: FC-YY-####
    year_prefix = datetime.now().strftime('%y')
    prefix = f"FC-{year_prefix}"
    
    last_invoice = await PurchaseInvoice.find({"invoice_number": {"$regex": f"^{prefix}"}}).sort("-invoice_number").limit(1).to_list()
    
    if last_invoice and last_invoice[0].invoice_number:
        try:
            parts = last_invoice[0].invoice_number.split('-')
            if len(parts) == 3:
                last_num = int(parts[2])
                new_num = last_num + 1
            else:
                new_num = 1
        except (IndexError, ValueError):
            new_num = 1
    else:
        new_num = 1
        
    invoice_number = f"{prefix}-{new_num:04d}"
    
    invoice = PurchaseInvoice(
        invoice_number=invoice_number,
        sunat_number=sunat_number,
        order_number=order.order_number,
        supplier_name=order.supplier_name,
        invoice_date=datetime.fromisoformat(invoice_date),
        items=order.items,
        total_amount=order.total_amount,
        payment_status=payment_status,
        amount_paid=round(amount_paid, 3),
        amount_in_words=order.amount_in_words
    )
    
    if amount_paid > 0 and payment_date:
        payment = Payment(
            amount=round(amount_paid, 3),
            date=datetime.fromisoformat(payment_date),
            notes="Pago inicial al registrar factura"
        )
        invoice.payments.append(payment)
    
    await invoice.insert()
    
    order.status = OrderStatus.INVOICED
    await order.save()
    
    return invoice

async def delete_order(order_number: str) -> bool:
    order = await PurchaseOrder.find_one(PurchaseOrder.order_number == order_number)
    if not order:
        raise NotFoundException("Order", order_number)
    
    if order.status == OrderStatus.INVOICED:
        raise ValidationException("No se puede eliminar una orden facturada. Elimine la factura de proveedor primero.")
        
    await order.delete()
    return True

async def delete_invoice(invoice_number: str) -> bool:
    invoice = await PurchaseInvoice.find_one(PurchaseInvoice.invoice_number == invoice_number)
    if not invoice:
        raise NotFoundException("Invoice", invoice_number)
        
    if invoice.reception_status == "RECEIVED":
        raise ValidationException("Cannot delete received invoice.")

    # Revert order status if exists
    if invoice.order_number:
        order = await PurchaseOrder.find_one(PurchaseOrder.order_number == invoice.order_number)
        if order:
            # Check for other active invoices
            other_invoices = await PurchaseInvoice.find(
                {"order_number": invoice.order_number, "invoice_number": {"$ne": invoice.invoice_number}}
            ).count()
            
            if other_invoices == 0:
                order.status = OrderStatus.PENDING
                await order.save()
                print(f"Rollback: Purchase Order {order.order_number} status reverted to PENDING")
            
    await invoice.delete()
    return True

# ==================== PAYMENTS ====================

async def register_payment(invoice_number: str, amount: float, payment_date: str, notes: str = None) -> Dict[str, Any]:
    invoice = await get_invoice(invoice_number)
    
    if invoice.payment_status == PaymentStatus.PAID:
        raise ValidationException("Invoice already fully paid")
    
    pending = invoice.total_amount - invoice.amount_paid
    if amount > pending:
        raise ValidationException(f"Payment amount exceeds pending amount (S/ {pending:.2f})")
    
    payment = Payment(
        amount=amount,
        date=datetime.fromisoformat(payment_date),
        notes=notes
    )
    invoice.payments.append(payment)
    invoice.amount_paid += amount
    
    if invoice.amount_paid >= invoice.total_amount:
        invoice.payment_status = PaymentStatus.PAID
    elif invoice.amount_paid > 0:
        invoice.payment_status = PaymentStatus.PARTIAL
    
    await invoice.save()
    return {"message": "Payment registered successfully", "invoice": invoice}

# ==================== SUPPLIERS ====================

async def get_suppliers(company_id: Optional[str] = None) -> List[Supplier]:
    query = {}
    if company_id:
        company = await Company.get(company_id)
        if company and company.enterprise_settings.suppliers_mode == 'SOVEREIGN':
            query = {"company_id": company_id}
        # If SHARED, query remains {}, returning ALL suppliers (Global View)
            
    return await Supplier.find(query).to_list()

async def get_supplier_by_ruc(ruc: str, company_id: Optional[str] = None) -> Supplier:
    query = {"ruc": ruc}
    if company_id:
        company = await Company.get(company_id)
        if company and company.enterprise_settings.suppliers_mode == 'SOVEREIGN':
            query["company_id"] = company_id
        # If SHARED, we don't filter by company_id, allowing global lookup
            
    supplier = await Supplier.find_one(query)
    if not supplier:
        raise NotFoundException("Supplier", ruc)
    return supplier

async def create_supplier(supplier: Supplier) -> Supplier:
    # Check governance mode to decide if it's a global or local supplier
    if supplier.company_id:
        company = await Company.get(supplier.company_id)
        if company and company.enterprise_settings.suppliers_mode == 'SHARED':
            supplier.company_id = None # Set to Global
            
    # Check for existing
    query = {"ruc": supplier.ruc}
    if supplier.company_id:
        query["company_id"] = supplier.company_id
    else:
        query["company_id"] = None # Look for global record
        
    existing = await Supplier.find_one(query)
    if existing:
        raise DuplicateEntityException("Supplier", "ruc", supplier.ruc)
        
    await supplier.insert()
    return supplier

async def update_supplier(id: PydanticObjectId, supplier_data: Supplier) -> Supplier:
    supplier = await Supplier.get(id)
    if not supplier:
        raise NotFoundException("Supplier", str(id))
    
    supplier.name = supplier_data.name
    supplier.ruc = supplier_data.ruc
    supplier.email = supplier_data.email
    supplier.phone = supplier_data.phone
    supplier.address = supplier_data.address
    supplier.contact_person = supplier_data.contact_person
    
    # Fiscal Fields
    supplier.sunat_state = supplier_data.sunat_state
    supplier.sunat_condition = supplier_data.sunat_condition
    supplier.is_retention_agent = supplier_data.is_retention_agent
    supplier.is_perception_agent = supplier_data.is_perception_agent
    supplier.main_activity = supplier_data.main_activity
    
    await supplier.save()
    return supplier

async def delete_supplier(id: PydanticObjectId) -> bool:
    supplier = await Supplier.get(id)
    if not supplier:
        raise NotFoundException("Supplier", str(id))
    await supplier.delete()
    return True

# ==================== RECEPTION ====================

async def create_reception_guide(invoice_number: str, notes: str, created_by: str, sunat_number: Optional[str] = None, company_id: Optional[str] = None) -> Dict[str, Any]:
    invoice = await PurchaseInvoice.find_one(PurchaseInvoice.invoice_number == invoice_number)
    if not invoice:
        raise NotFoundException("Invoice", invoice_number)
    
    if invoice.reception_status == "RECEIVED":
        raise ValidationException("Invoice already received")
    
    # Generate Internal ID: GC-YY-####
    year_prefix = datetime.now().strftime('%y')
    prefix = f"GC-{year_prefix}"
    
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
    
    guide_items = []
    for item in invoice.items:
        product = await inventory_service.get_product_by_sku(item.product_sku)
        
        guide_items.append(GuideItem(
            sku=item.product_sku,
            product_name=product.name,
            quantity=item.quantity,
            unit_cost=item.unit_cost
        ))
    
    guide = DeliveryGuide(
        guide_number=guide_number,
        sunat_number=sunat_number,
        guide_type=GuideType.RECEPTION,
        status=GuideStatus.DELIVERED,
        invoice_number=invoice_number,
        customer_name=invoice.supplier_name,
        customer_ruc=invoice.supplier_ruc or "00000000000",
        items=guide_items,
        notes=notes,
        created_by=created_by,
        delivery_date=datetime.now(),
        company_id=str(invoice.company_id)
    )
    await guide.insert()
    
    # Move Inventory (IN) and update weighted average cost
    for item in invoice.items:
        await inventory_service.register_movement(
            sku=item.product_sku,
            quantity=item.quantity,
            movement_type=MovementType.IN,
            reference=guide_number,
            unit_cost=item.unit_cost,
            company_id=company_id or invoice.company_id,
            legal_owner_id=company_id or invoice.company_id
        )
    
    invoice.reception_status = "RECEIVED"
    invoice.guide_id = str(guide.id)
    await invoice.save()
    
    return {
        "message": "Reception guide created successfully",
        "guide_number": guide_number,
        "items_count": len(guide_items)
    }

async def import_invoice_xml(data: dict, auto_reception: bool = True, exchange_rate: Optional[float] = None, company_id: Optional[str] = None) -> PurchaseInvoice:
    """Importación directa de factura de proveedor XML saltando cotización/orden manual"""
    from app.models.purchasing import PurchaseOrder, PurchaseInvoice, OrderStatus, PaymentStatus
    from app.models.inventory import DeliveryGuide, GuideItem, GuideType, GuideStatus, MovementType
    
    # 0. Validación de Factura Duplicada (ADN de SUNAT)
    sunat_number = data.get('sunat_number') or data.get('document_number')
    supplier_ruc = data.get('supplier', {}).get('ruc')
    if sunat_number and supplier_ruc:
        existing = await PurchaseInvoice.find_one({
            "sunat_number": sunat_number,
            "supplier_ruc": supplier_ruc
        })
        if existing:
            raise ValidationException(
                f"DOCUMENTO DUPLICADO: La factura '{sunat_number}' del proveedor {data['supplier']['name']} ya se encuentra registrada "
                f"en el sistema. No se puede procesar dos veces el mismo archivo XML."
            )

    # 1. Crear Orden de Compra Interna (Estado: RECIBIDA/FACTURADA)
    year_prefix = datetime.now().strftime('%y')
    prefix = f"OC-{year_prefix}"
    last_order = await PurchaseOrder.find({"order_number": {"$regex": f"^{prefix}"}}).sort("-order_number").limit(1).to_list()
    
    new_num = 1
    if last_order and last_order[0].order_number:
        try:
            parts = last_order[0].order_number.split('-')
            if len(parts) == 3:
                new_num = int(parts[2]) + 1
        except: pass
    
    order_number = f"{prefix}-{new_num:04d}"
    
    # 1. Moneda y Tipo de Cambio
    currency_val = data.get('currency', 'PEN')
    if currency_val in ['SOLES', 'PEN']: 
        currency_val = 'PEN'
        current_exchange_rate = 1.0
    elif currency_val in ['DOLARES', 'USD']:
        currency_val = 'USD'
        # Buscar tipo de cambio para la fecha del documento
        from app.models.finance import ExchangeRate
        doc_date = datetime.fromisoformat(data['date']).replace(hour=0, minute=0, second=0, microsecond=0)
        rate_obj = await ExchangeRate.find_one(ExchangeRate.date == doc_date)
        if not rate_obj:
            rate_obj = await ExchangeRate.find({"date": {"$lte": doc_date}}).sort("-date").limit(1).to_list()
            current_exchange_rate = rate_obj[0].sale if rate_obj else (exchange_rate or 3.75)
        else:
            current_exchange_rate = rate_obj.sale

    # 1.5 Enriquecer Items con Maestro de Productos (VALIDACIÓN OBLIGATORIA SOLO PARA FILTROS)
    order_items = []
    from app.models.purchasing import OrderItem, SupplierProductPrice
    for item in data.get('items', []):
        sku = item['product_sku']
        # Obtener tipo de producto asignado en revisión (Frontend usa 'classification')
        classification = item.get('classification') or item.get('product_type') or item.get('type') or 'COMMERCIAL'
        is_misc = item.get('is_misc', False)
        
        # Buscar en maestro
        product = await inventory_service.find_product_robustly(sku)
        
        # Guardafuegos estricto de marca para Filtros/Lubricantes
        if product:
            from app.utils.norm_utils import detect_brand_from_text
            detected_brand = await detect_brand_from_text(item.get('product_name', ''))
            is_technical = getattr(product, 'type', None) in ['COMMERCIAL', 'LUBRICANT']
            if is_technical and (detected_brand == "N/A" or product.brand != detected_brand):
                product = None
        
        # Bloqueo estricto SOLO para filtros (FILTER/COMMERCIAL)
        if not product and not is_misc and (classification in ['FILTER', 'COMMERCIAL']):
            raise ValidationException(f"PRODUCTO NO ENCONTRADO: El SKU '{sku}' con marca válida no existe en su Maestro de Productos. Por favor, regístrelo en el módulo de Inventario antes de procesar este documento.")

        # --- LÓGICA DE CLASE MUNDIAL: Catálogo de Precios por Proveedor ---
        if product and supplier_ruc:
            price_val = item['unit_price']
            price_base = item.get('unit_value', price_val / 1.18)
            
            # Buscar si ya tenemos registro de este proveedor para este producto
            s_price = await SupplierProductPrice.find_one({
                "supplier_ruc": supplier_ruc,
                "product_sku": product.sku,
                "company_id": company_id
            })
            
            if s_price:
                s_price.last_purchase_value = price_base
                s_price.last_purchase_price = price_val
                s_price.currency = currency_val
                s_price.last_purchase_date = datetime.now()
                await s_price.save()
            else:
                s_price = SupplierProductPrice(
                    supplier_ruc=supplier_ruc,
                    product_sku=product.sku,
                    company_id=company_id,
                    last_purchase_value=price_base,
                    last_purchase_price=price_val,
                    currency=currency_val
                )
                await s_price.insert()

        order_items.append(OrderItem(
            product_id=str(product.id) if product else None,
            product_sku=product.sku if product else sku,
            product_name=product.name if product else item.get('product_name', 'Producto No Registrado'), 
            quantity=item['quantity'],
            unit_value=item.get('unit_value', item['unit_price'] / 1.18),
            unit_price=item['unit_price'],
            unit_cost=item['unit_price'], 
            tax_rate=item.get('tax_rate', 0.18),
            is_custom=True if not product else False
        ))
        
    order = PurchaseOrder(
        order_number=order_number,
        supplier_name=data['supplier']['name'], 
        supplier_ruc=data['supplier']['ruc'],
        supplier_address=data['supplier'].get('address'),
        items=order_items,
        status=OrderStatus.INVOICED,
        total_amount=data['total_amount'],
        currency=currency_val,
        exchange_rate=current_exchange_rate,
        date=datetime.fromisoformat(data['date']),
        company_id=company_id
    )
    await order.insert()
    
    # 2. Crear Factura de Proveedor
    prefix_inv = f"FC-{year_prefix}"
    last_inv = await PurchaseInvoice.find({"invoice_number": {"$regex": f"^{prefix_inv}"}}).sort("-invoice_number").limit(1).to_list()
    
    new_num_inv = 1
    if last_inv and last_inv[0].invoice_number:
        try:
            parts = last_inv[0].invoice_number.split('-')
            if len(parts) == 3:
                new_num_inv = int(parts[2]) + 1
        except: pass
    
    invoice_number = f"{prefix_inv}-{new_num_inv:04d}"
    
    # 2. Determinar Condición de Pago y Vencimiento
    payment_terms = data.get('payment_terms', 'Contado')
    installments = data.get('installments', [])
    
    payment_condition = "CREDITO" if (payment_terms.upper() == 'CRÉDITO' or payment_terms.upper() == 'CREDITO' or len(installments) > 0) else "CONTADO"
    
    # Calcular fecha de vencimiento
    due_date = None
    if payment_condition == "CREDITO":
        if installments:
            # Usar la fecha de la última cuota
            try:
                dates = [datetime.fromisoformat(inst['dueDate']) for inst in installments if inst.get('dueDate')]
                if dates: due_date = max(dates)
            except: pass
        
        # Fallback: 30 días después de la fecha de factura
        if not due_date:
            from datetime import timedelta
            due_date = order.date + timedelta(days=30)

    invoice = PurchaseInvoice(
        invoice_number=invoice_number,
        sunat_number=data.get('sunat_number') or data.get('document_number'),
        order_number=order_number,
        supplier_name=order.supplier_name,
        supplier_ruc=order.supplier_ruc,
        supplier_address=order.supplier_address,
        invoice_date=order.date,
        items=order.items,
        total_amount=order.total_amount,
        currency=order.currency,
        exchange_rate=current_exchange_rate,
        payment_condition=payment_condition,
        payment_status=PaymentStatus.PENDING, # Siempre nace pendiente en importación XML
        due_date=due_date,
        amount_paid=0.0,
        reception_status="PENDING",
        company_id=company_id,
        is_financial_confirmed=False # Requiere doble confirmación
    )
    
    # El registro de pago automático se ha removido.
    # Ahora se hace en el Buzón de Sinceramiento.
        
    await invoice.insert()
    
    # 3. Auto-Recepción (Aumento de stock)
    if auto_reception:
        prefix_g = f"GC-{year_prefix}"
        last_g = await DeliveryGuide.find({"guide_number": {"$regex": f"^{prefix_g}"}}).sort("-guide_number").limit(1).to_list()
        new_num_g = 1
        if last_g and last_g[0].guide_number:
            try:
                parts = last_g[0].guide_number.split('-')
                if len(parts) == 3:
                    new_num_g = int(parts[2]) + 1
            except: pass
        guide_number = f"{prefix_g}-{new_num_g:04d}"
        
        guide_items = []
        for item in order.items:
            product = await inventory_service.find_product_robustly(item.product_sku)
            
            guide_items.append(GuideItem(
                product_id=str(product.id) if product else None,
                sku=item.product_sku,
                product_name=product.name if product else item.product_name,
                quantity=item.quantity,
                unit_cost=item.unit_cost
            ))
            
            # EL STOCK YA NO SE MUEVE AUTOMÁTICAMENTE AQUÍ.
            # Se delegará a la confirmación física de la Guía de Recepción (Logística).
            
        guide = DeliveryGuide(
            guide_number=guide_number,
            guide_type=GuideType.RECEPTION,
            status=GuideStatus.DRAFT,     # Nace pendiente de confirmación física
            invoice_number=invoice_number,
            order_number=order_number,
            customer_name=order.supplier_name, 
            customer_ruc=order.supplier_ruc or "00000000000", # Fallback preventivo
            items=guide_items,
            issue_date=order.date,
            company_id=str(order.company_id)
        )
        await guide.insert()
        
        # La factura se mantiene en PENDING de recepción hasta que se procese la guía
        invoice.guide_id = str(guide.id)
        await invoice.save()

    return invoice

from datetime import datetime, timedelta

# ... existing imports ...

async def bulk_update_payment_condition(invoice_numbers: List[str], condition: str, days: Optional[int] = 30, payment_terms: Optional[dict] = None) -> Dict[str, Any]:
    """Actualización masiva de condición de pago (Sinceramiento Financiero)"""
    count = 0
    for num in invoice_numbers:
        invoice = await PurchaseInvoice.find_one(PurchaseInvoice.invoice_number == num)
        if not invoice: continue
        
        # HARDENING: Integrity Gate check (World-Class Firewall)
        is_ready = getattr(invoice, 'is_catalog_confirmed', False) and \
                   getattr(invoice, 'is_customer_confirmed', False) and \
                   getattr(invoice, 'is_exchange_rate_confirmed', False)
        
        if not is_ready:
            # Si llegó aquí por bypass de UI, lo omitimos para proteger la integridad financiera
            continue
        
        changed = False
        if condition == "CREDITO":
            if invoice.payment_condition != "CREDITO" or not invoice.is_financial_confirmed:
                invoice.payment_condition = "CREDITO"
                invoice.payment_status = PaymentStatus.PENDING
                invoice.amount_paid = 0.0
                invoice.payments = [p for p in invoice.payments if p.notes and "automático" not in p.notes.lower()]
                changed = True
            
            if payment_terms:
                invoice.payment_terms = payment_terms
                installments = payment_terms.get('installments', [])
                if installments:
                    try:
                        dates = [datetime.fromisoformat(inst['date']) for inst in installments if inst.get('date')]
                        if dates: invoice.due_date = max(dates)
                    except: pass
                changed = True
            elif not payment_terms and (not invoice.payment_terms or "days" not in str(invoice.payment_terms)):
                invoice.due_date = invoice.invoice_date + timedelta(days=days or 30)
                invoice.payment_terms = {"type": "CREDIT", "days": days or 30}
                changed = True

        elif condition == "CONTADO":
            if invoice.payment_condition != "CONTADO" or not invoice.is_financial_confirmed:
                invoice.payment_condition = "CONTADO"
                invoice.payment_status = PaymentStatus.PAID
                invoice.amount_paid = invoice.total_amount
                invoice.payment_terms = {"type": "CASH"}
                
                has_full_payment = any(p.amount >= invoice.total_amount for p in invoice.payments)
                if not has_full_payment:
                    payment = Payment(
                        amount=invoice.total_amount,
                        date=datetime.now(),
                        notes="Confirmación manual: Liquidación Contado (Sinceramiento)"
                    )
                    invoice.payments.append(payment)
                changed = True
        
        if not invoice.is_financial_confirmed:
            invoice.is_financial_confirmed = True
            changed = True
            
        if changed:
            await invoice.save()
            count += 1
            
    return {"message": f"Se sinceraron {count} facturas correctamente", "count": count}
