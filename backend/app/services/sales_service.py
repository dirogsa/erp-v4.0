from typing import List, Optional, Dict, Any
from datetime import datetime
from beanie import PydanticObjectId
from app.models.sales import SalesOrder, SalesInvoice, Customer, PaymentStatus, OrderStatus, Payment, CustomerBranch, SalesQuote, QuoteStatus
from app.models.inventory import DeliveryGuide, GuideType, GuideStatus, GuideItem, MovementType, StockMovement
from app.services import inventory_service
from app.exceptions.business_exceptions import NotFoundException, ValidationException, DuplicateEntityException
from app.schemas.common import PaginatedResponse

# ==================== ORDERS ====================

async def get_orders(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
) -> PaginatedResponse[SalesOrder]:
    query = {}
    
    if search:
        query["$or"] = [
            {"order_number": {"$regex": search, "$options": "i"}},
            {"customer_name": {"$regex": search, "$options": "i"}}
        ]
    
    if status:
        query["status"] = status
        
    if date_from or date_to:
        query["date"] = {}
        if date_from:
            query["date"]["$gte"] = datetime.fromisoformat(date_from)
        if date_to:
            query["date"]["$lte"] = datetime.fromisoformat(date_to)

    total = await SalesOrder.find(query).count()
    items = await SalesOrder.find(query).sort("-date").skip(skip).limit(limit).to_list()
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=skip // limit + 1,
        pages=(total + limit - 1) // limit,
        size=limit
    )

async def get_product_sales_history(sku: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Obtiene el historial de ventas de un producto específico.
    Busca en las órdenes de venta (SalesOrder) que contengan el SKU.
    """
    orders = await SalesOrder.find(
        {"items.product_sku": sku}
    ).sort("-date").limit(limit).to_list()
    
    history = []
    for order in orders:
        # Encontrar el item específico dentro de la orden
        item = next((i for i in order.items if i.product_sku == sku), None)
        if item:
            history.append({
                "date": order.date,
                "order_number": order.order_number,
                "customer_name": order.customer_name,
                "quantity": item.quantity,
                "unit_price": item.unit_price
            })
            
    return history

async def create_order(order: SalesOrder) -> SalesOrder:
    # Generate sequential order number: OV-YY-####
    year_prefix = datetime.now().strftime('%y')
    prefix = f"OV-{year_prefix}"
    
    # Regex to match specific prefix pattern for the current year
    last_order = await SalesOrder.find({"order_number": {"$regex": f"^{prefix}"}}).sort("-order_number").limit(1).to_list()
    
    if last_order and last_order[0].order_number:
        try:
            # Extract sequence: OV-25-0001 -> 0001
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
    order.total_amount = round(sum(item.quantity * item.unit_price for item in order.items), 3)
    
    await order.insert()
    return order

async def convert_backorder(order_number: str) -> Dict[str, Any]:
    """
    Intelligent backorder conversion with partial fulfillment.
    Splits items into:
    - Available items -> New Order (PENDING)
    - Unavailable items -> New Backorder (BACKORDER)
    """
    original_order = await SalesOrder.find_one(SalesOrder.order_number == order_number)
    if not original_order:
        raise NotFoundException("Order", order_number)
    
    if original_order.status != OrderStatus.BACKORDER:
        raise ValidationException(f"Order is not in BACKORDER status (Current: {original_order.status})")
    
    # Classify items by availability
    available_items = []
    pending_items = []
    
    for item in original_order.items:
        product = await inventory_service.get_product_by_sku(item.product_sku)
        
        if product.stock_current >= item.quantity:
            # Full quantity available
            available_items.append(item)
        elif product.stock_current > 0:
            # Partial quantity available - split the item
            from app.models.sales import OrderItem
            available_items.append(OrderItem(
                product_sku=item.product_sku,
                quantity=product.stock_current,
                unit_price=item.unit_price
            ))
            pending_items.append(OrderItem(
                product_sku=item.product_sku,
                quantity=item.quantity - product.stock_current,
                unit_price=item.unit_price
            ))
        else:
            # No stock available
            pending_items.append(item)
    
    result = {
        "original_order": order_number,
        "orders_created": [],
        "backorders_created": []
    }
    
    # Create new Order for available items
    if available_items:
        new_order = SalesOrder(
            customer_name=original_order.customer_name,
            customer_ruc=original_order.customer_ruc,
            items=available_items,
            status=OrderStatus.PENDING,
            delivery_branch_name=original_order.delivery_branch_name,
            delivery_address=original_order.delivery_address,
            payment_terms=original_order.payment_terms,
            related_quote_number=original_order.related_quote_number,
            issuer_info=original_order.issuer_info
        )
        created_order = await create_order(new_order)
        result["orders_created"].append(created_order.order_number)
    
    # Create new Backorder for pending items
    if pending_items:
        new_backorder = SalesOrder(
            customer_name=original_order.customer_name,
            customer_ruc=original_order.customer_ruc,
            items=pending_items,
            status=OrderStatus.BACKORDER,
            delivery_branch_name=original_order.delivery_branch_name,
            delivery_address=original_order.delivery_address,
            payment_terms=original_order.payment_terms,
            related_quote_number=original_order.related_quote_number,
            issuer_info=original_order.issuer_info
        )
        created_backorder = await create_order(new_backorder)
        result["backorders_created"].append(created_backorder.order_number)
    
    # Mark original as CONVERTED (maintains audit trail)
    original_order.status = OrderStatus.CONVERTED
    await original_order.save()
    
    # Build user-friendly message
    messages = []
    if result["orders_created"]:
        messages.append(f"✅ Orden creada: {', '.join(result['orders_created'])} ({len(available_items)} items)")
    if result["backorders_created"]:
        messages.append(f"🔄 Backorder creado: {', '.join(result['backorders_created'])} ({len(pending_items)} items pendientes)")
    
    result["message"] = ". ".join(messages) if messages else "Sin cambios"
    return result

async def check_backorder_availability(order_number: str) -> Dict[str, Any]:
    order = await SalesOrder.find_one(SalesOrder.order_number == order_number)
    if not order:
        raise NotFoundException("Order", order_number)
    
    if order.status != OrderStatus.BACKORDER:
        return {
            "can_fulfill": False,
            "message": f"Order is not in BACKORDER status (Current: {order.status})"
        }
    
    # Check stock availability for all items
    items_status = []
    can_fulfill = True
    
    for item in order.items:
        product = await inventory_service.get_product_by_sku(item.product_sku)
        is_available = product.stock_current >= item.quantity
        
        if not is_available:
            can_fulfill = False
        
        items_status.append({
            "sku": item.product_sku,
            "name": product.name,
            "required": item.quantity,
            "available": product.stock_current,
            "is_available": is_available
        })
    
    return {
        "can_fulfill": can_fulfill,
        "order_number": order.order_number,
        "items": items_status
    }

# ==================== INVOICES ====================

async def get_invoices(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    payment_status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
) -> PaginatedResponse[SalesInvoice]:
    query = {}
    
    if search:
        query["$or"] = [
            {"invoice_number": {"$regex": search, "$options": "i"}},
            {"customer_name": {"$regex": search, "$options": "i"}},
            {"order_number": {"$regex": search, "$options": "i"}}
        ]
    
    if payment_status:
        query["payment_status"] = payment_status
        
    if date_from or date_to:
        query["invoice_date"] = {}
        if date_from:
            query["invoice_date"]["$gte"] = datetime.fromisoformat(date_from)
        if date_to:
            query["invoice_date"]["$lte"] = datetime.fromisoformat(date_to)

    total = await SalesInvoice.find(query).count()
    items = await SalesInvoice.find(query).sort("-invoice_date").skip(skip).limit(limit).to_list()
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=skip // limit + 1,
        pages=(total + limit - 1) // limit,
        size=limit
    )

async def get_invoice(invoice_number: str) -> SalesInvoice:
    invoice = await SalesInvoice.find_one(SalesInvoice.invoice_number == invoice_number)
    if not invoice:
        raise NotFoundException("Invoice", invoice_number)
    return invoice

async def create_invoice(
    order_number: str, 
    invoice_date: str, 
    sunat_number: Optional[str] = None,
    payment_status: PaymentStatus = PaymentStatus.PENDING,
    amount_paid: float = 0.0,
    payment_date: Optional[str] = None,
    amount_in_words: Optional[str] = None,
    payment_terms: Optional[dict] = None,
    due_date: Optional[str] = None,
    issuer_info: Optional[Dict[str, Any]] = None
) -> SalesInvoice:
    
    order = await SalesOrder.find_one(SalesOrder.order_number == order_number)
    if not order:
        raise NotFoundException("Order", order_number)
    
    if order.status == OrderStatus.INVOICED:
        raise ValidationException("Order already invoiced")
    
    if amount_paid > order.total_amount:
        raise ValidationException("Amount paid cannot exceed total amount")
    
    # Generate Internal ID: FV-YY-####
    year_prefix = datetime.now().strftime('%y')
    prefix = f"FV-{year_prefix}"
    
    last_invoice = await SalesInvoice.find({"invoice_number": {"$regex": f"^{prefix}"}}).sort("-invoice_number").limit(1).to_list()
    
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
    
    invoice = SalesInvoice(
        invoice_number=invoice_number,
        sunat_number=sunat_number,
        order_number=order.order_number,
        customer_name=order.customer_name,
        customer_ruc=order.customer_ruc,
        invoice_date=datetime.fromisoformat(invoice_date),
        due_date=datetime.fromisoformat(due_date) if due_date else None,
        items=order.items,
        total_amount=order.total_amount,
        delivery_branch_name=order.delivery_branch_name,
        delivery_address=order.delivery_address,
        payment_status=payment_status,
        amount_paid=round(amount_paid, 3),
        amount_in_words=amount_in_words,
        payment_terms=payment_terms or order.payment_terms,
        issuer_info=issuer_info or order.issuer_info # Inherit from order if not provided
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
    order = await SalesOrder.find_one(SalesOrder.order_number == order_number)
    if not order:
        raise NotFoundException("Order", order_number)
    
    if order.status == OrderStatus.INVOICED:
        raise ValidationException("Cannot delete invoiced order. Delete the invoice first.")

    # Revert Quote status if it was converted from one
    if order.related_quote_number:
        # Check if there are other orders from this same quote
        other_orders_count = await SalesOrder.find(
            {"related_quote_number": order.related_quote_number, "order_number": {"$ne": order.order_number}}
        ).count()
        
        if other_orders_count == 0:
            # Revert quote status
            quote = await SalesQuote.find_one(SalesQuote.quote_number == order.related_quote_number)
            if quote:
                quote.status = QuoteStatus.ACCEPTED
                await quote.save()
        
    await order.delete()
    return True

async def delete_invoice(invoice_number: str) -> bool:
    invoice = await SalesInvoice.find_one(SalesInvoice.invoice_number == invoice_number)
    if not invoice:
        raise NotFoundException("Invoice", invoice_number)
        
    if invoice.dispatch_status == "DISPATCHED":
        raise ValidationException("Cannot delete dispatched invoice. Return stock first.")

    # Revert order status if exists
    if invoice.order_number:
        order = await SalesOrder.find_one(SalesOrder.order_number == invoice.order_number)
        if order:
            # Check if there are other active invoices for this order
            # (In case of partial invoicing in future, though currently 1-to-1)
            other_invoices = await SalesInvoice.find(
                {"order_number": invoice.order_number, "invoice_number": {"$ne": invoice.invoice_number}}
            ).count()
            
            if other_invoices == 0:
                print(f"Reverting Order {order.order_number} status to PENDING")
                order.status = OrderStatus.PENDING
                await order.save()
            
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

# ==================== CUSTOMERS ====================

async def get_customers() -> List[Customer]:
    return await Customer.find_all().to_list()

async def get_customer_by_ruc(ruc: str) -> Customer:
    customer = await Customer.find_one(Customer.ruc == ruc)
    if not customer:
        raise NotFoundException("Customer", ruc)
    return customer

async def create_customer(customer: Customer) -> Customer:
    existing = await Customer.find_one(Customer.ruc == customer.ruc)
    if existing:
        raise DuplicateEntityException("Customer", "ruc", customer.ruc)
    await customer.insert()
    return customer

async def update_customer(id: PydanticObjectId, customer_data: Customer) -> Customer:
    customer = await Customer.get(id)
    if not customer:
        raise NotFoundException("Customer", str(id))
    
    customer.name = customer_data.name
    customer.ruc = customer_data.ruc
    customer.address = customer_data.address
    customer.phone = customer_data.phone
    customer.email = customer_data.email
    customer.branches = customer_data.branches
    customer.custom_discount_percent = customer_data.custom_discount_percent
    
    await customer.save()

    # Sync with linked User (Shop) if exists
    from app.models.auth import User
    linked_user = await User.find_one(User.ruc_linked == customer.ruc)
    if linked_user:
        linked_user.custom_discount_percent = customer.custom_discount_percent
        await linked_user.save()

    return customer

async def delete_customer(id: PydanticObjectId) -> bool:
    customer = await Customer.get(id)
    if not customer:
        raise NotFoundException("Customer", str(id))
    await customer.delete()
    return True

# ==================== CUSTOMER BRANCHES ====================

async def add_customer_branch(id: PydanticObjectId, branch: CustomerBranch) -> Customer:
    customer = await Customer.get(id)
    if not customer:
        raise NotFoundException("Customer", str(id))
    
    if branch.is_main:
        for b in customer.branches:
            b.is_main = False
    
    customer.branches.append(branch)
    await customer.save()
    return customer

async def get_customer_branches(id: PydanticObjectId) -> List[CustomerBranch]:
    customer = await Customer.get(id)
    if not customer:
        raise NotFoundException("Customer", str(id))
    return customer.branches

async def update_customer_branch(id: PydanticObjectId, branch_index: int, branch: CustomerBranch) -> Customer:
    customer = await Customer.get(id)
    if not customer:
        raise NotFoundException("Customer", str(id))
    
    if branch_index < 0 or branch_index >= len(customer.branches):
        raise NotFoundException("Branch", str(branch_index))
    
    if branch.is_main:
        for i, b in enumerate(customer.branches):
            if i != branch_index:
                b.is_main = False
    
    customer.branches[branch_index] = branch
    await customer.save()
    return customer

async def delete_customer_branch(id: PydanticObjectId, branch_index: int) -> Customer:
    customer = await Customer.get(id)
    if not customer:
        raise NotFoundException("Customer", str(id))
    
    if branch_index < 0 or branch_index >= len(customer.branches):
        raise NotFoundException("Branch", str(branch_index))
    
    active_branches = [b for b in customer.branches if b.is_active]
    if len(active_branches) == 1 and customer.branches[branch_index].is_active:
        raise ValidationException("Cannot delete the only active branch")
    
    customer.branches[branch_index].is_active = False
    await customer.save()
    return customer

# ==================== DISPATCH ====================

async def create_dispatch_guide(invoice_number: str, notes: str, created_by: str, sunat_number: Optional[str] = None, issuer_info: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    invoice = await SalesInvoice.find_one(SalesInvoice.invoice_number == invoice_number)
    if not invoice:
        raise NotFoundException("Invoice", invoice_number)
    
    if invoice.dispatch_status == "DISPATCHED":
        raise ValidationException("Invoice already dispatched")
    
    # Validate stock
    for item in invoice.items:
        product = await inventory_service.get_product_by_sku(item.product_sku)
        if product.stock_current < item.quantity:
            raise ValidationException(
                f"Insufficient stock for {product.name}. Available: {product.stock_current}, Required: {item.quantity}"
            )
    
    # Generate Internal ID: GV-YY-####
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
    
    guide_items = []
    for item in invoice.items:
        product = await inventory_service.get_product_by_sku(item.product_sku)
        guide_items.append(GuideItem(
            sku=item.product_sku,
            product_name=product.name,
            quantity=item.quantity,
            unit_cost=product.cost
        ))
    
    target_text = invoice.customer_name
    if invoice.delivery_branch_name:
        target_text = f"{invoice.customer_name} - {invoice.delivery_branch_name}"
    
    guide = DeliveryGuide(
        guide_number=guide_number,
        sunat_number=sunat_number,
        guide_type=GuideType.DISPATCH,
        status=GuideStatus.COMPLETED,
        invoice_id=invoice_number,
        target=target_text,
        delivery_address=invoice.delivery_address,
        items=guide_items,
        notes=notes,
        created_by=created_by,
        completed_date=datetime.now(),
        issuer_info=issuer_info or invoice.issuer_info # Inherit from invoice if not provided
    )
    await guide.insert()
    
    # Move Inventory (OUT)
    for item in invoice.items:
        await inventory_service.register_movement(
            sku=item.product_sku,
            quantity=item.quantity,
            movement_type=MovementType.OUT,
            reference=guide_number
        )
    
    invoice.dispatch_status = "DISPATCHED"
    invoice.guide_id = str(guide.id)
    await invoice.save()
    
    return {
        "message": "Dispatch guide created successfully",
        "guide_number": guide_number,
        "items_count": len(guide_items),
        "delivery_address": invoice.delivery_address
    }
