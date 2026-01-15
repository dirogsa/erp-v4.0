from typing import List, Optional, Dict, Any
from datetime import datetime
from beanie import PydanticObjectId
from app.models.sales import SalesOrder, SalesInvoice, Customer, PaymentStatus, OrderStatus, Payment, CustomerBranch, SalesQuote, QuoteStatus
from app.models.inventory import Product, DeliveryGuide, GuideType, GuideStatus, GuideItem, MovementType, StockMovement
from app.models.auth import User
from app.models.marketing import LoyaltyConfig


from app.services import inventory_service, audit_service
from app.services.audit_service import AuditService
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

async def get_product_sales_history(sku: str, limit: int = 10, customer_ruc: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Obtiene el historial de ventas de un producto específico.
    Busca en las órdenes de venta (SalesOrder) que contengan el SKU.
    """
    query = {"items.product_sku": sku}
    if customer_ruc:
        query["customer_ruc"] = customer_ruc

    orders = await SalesOrder.find(query).sort("-date").limit(limit).to_list()
    
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

async def create_order(order: SalesOrder, user: Optional[User] = None) -> SalesOrder:
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
    
    # Calculate Points Spent (Redemption)
    points_spent = 0
    # Store fetched products to avoid re-fetching later
    fetched_products = {}
    
    for item in order.items:
        # Fetch product to check points_cost
        if item.product_sku not in fetched_products:
            prod = await Product.find_one(Product.sku == item.product_sku)
            fetched_products[item.product_sku] = prod
        
        product = fetched_products.get(item.product_sku)
        
        if product and getattr(product, 'points_cost', 0) > 0:
            points_spent += product.points_cost * item.quantity
    
    order.loyalty_points_spent = points_spent
    
    # Verify User Balance if points are spent
    user = None
    if points_spent > 0:
        if not order.customer_email:
             # Try to find user by RUC if email not provided (less robust but helpful fallback)
             # But usually frontend sends customer_email if linked.
             # If no email, we can't deduct points from a user account clearly.
             # Assume customer_email is populated if user logged in.
             print("Warning: Redemption order without customer_email")
        else:
             user = await User.find_one(User.email == order.customer_email)
             if not user:
                 raise ValidationException(f"User not found for email {order.customer_email}")
             
             if (user.loyalty_points or 0) < points_spent:
                 raise ValidationException(f"Insufficient points. Required: {points_spent}, Available: {user.loyalty_points}")

    # Loyalty Points Logic (Gaining Points)
    loyalty_config = await LoyaltyConfig.find_one({})
    if not loyalty_config:
        loyalty_config = LoyaltyConfig()
    
    total_points_gained = 0
    if loyalty_config.is_active:
        for item in order.items:
            # If points are already snapshotted (e.g. from Quote), use them
            if item.loyalty_points is not None and item.loyalty_points > 0:
                total_points_gained += item.loyalty_points * item.quantity
                continue
            
            # Otherwise allow 0 if explicitly set?
            # If it is 0, it might mean "no points".
            if item.loyalty_points is not None and item.loyalty_points == 0:
                 continue

            # If not set (None/null), calculate it
            product = fetched_products.get(item.product_sku)
            if not product:
                product = await Product.find_one(Product.sku == item.product_sku)
                
            if product:
                points = 0
                if product.loyalty_points > 0:
                    points = product.loyalty_points
                elif loyalty_config.points_per_sole > 0:
                    points = int(item.unit_price * loyalty_config.points_per_sole)
                
                item.loyalty_points = points
                total_points_gained += points * item.quantity
    
    order.loyalty_points_granted = total_points_gained
    
    await order.insert()

    # Update User Points if linked (Gain and Spend)
    if order.customer_email:
        if not user:
             user = await User.find_one(User.email == order.customer_email)
             
        if user:
            # Deduct spent points (Always from public loyalty_points as it's for Shop redemptions)
            if points_spent > 0:
                user.loyalty_points = (user.loyalty_points or 0) - points_spent
                
            # Add gained points based on source
            if total_points_gained > 0:
                if order.source == "SHOP":
                    user.loyalty_points = (user.loyalty_points or 0) + total_points_gained
                else: # source == "ERP" or other
                    if not loyalty_config.only_web_accumulation:
                        # If not only web, do they go to public or internal? 
                        # Based on user request: Physical sales go to internal points.
                        user.internal_points_local = (user.internal_points_local or 0) + total_points_gained
                    else:
                        # If only web is active, ERP sales don't even update internal points? 
                        # Actually he said "local sales are internal", so let's keep them in internal.
                        user.internal_points_local = (user.internal_points_local or 0) + total_points_gained
                
            if total_points_gained > 0 or points_spent > 0:
                user.cumulative_sales = (user.cumulative_sales or 0) + order.total_amount
                await user.save()

    if user:
        await AuditService.log_action(
            user=user,
            action="CREATE",
            module="SALES",
            description=f"Se creó la Orden de Venta {order.order_number} por un total de S/ {order.total_amount}",
            entity_id=str(order.id),
            entity_name=order.order_number
        )

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
                unit_price=item.unit_price,
                loyalty_points=item.loyalty_points
            ))
            pending_items.append(OrderItem(
                product_sku=item.product_sku,
                quantity=item.quantity - product.stock_current,
                unit_price=item.unit_price,
                loyalty_points=item.loyalty_points
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
            {"sunat_number": {"$regex": search, "$options": "i"}},
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
    items = await SalesInvoice.find(query).sort("-sunat_number", "-invoice_date").skip(skip).limit(limit).to_list()
    
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
    issuer_info: Optional[Dict[str, Any]] = None,
    items_to_invoice: Optional[List[Any]] = None, # List of {product_sku, quantity}
    user: Optional[User] = None
) -> SalesInvoice:
    
    order = await SalesOrder.find_one(SalesOrder.order_number == order_number)
    if not order:
        raise NotFoundException("Order", order_number)
    
    if order.status == OrderStatus.INVOICED:
        raise ValidationException("Order already fully invoiced")

    # Determine which items and quantities to invoice
    final_invoice_items = []
    invoice_total = 0.0
    
    if items_to_invoice is None:
        # Default: Invoice all pending quantities
        for item in order.items:
            pending_qty = item.quantity - item.invoiced_quantity
            if pending_qty > 0:
                # Create a copy of the item for the invoice
                from app.models.sales import OrderItem
                invoice_item = OrderItem(**item.model_dump())
                invoice_item.quantity = pending_qty
                # Reset invoiced_quantity for the invoice snapshot as it's the current quantity being invoiced
                invoice_item.invoiced_quantity = pending_qty 
                final_invoice_items.append(invoice_item)
                invoice_total += pending_qty * item.unit_price
                # Update the order's record of invoiced quantity
                item.invoiced_quantity += pending_qty
    else:
        # Specific items provided
        for entry in items_to_invoice:
            # entry might be an InvoicedItem schema or a dict
            sku = entry.product_sku if hasattr(entry, 'product_sku') else entry.get('product_sku')
            qty_to_invoice = entry.quantity if hasattr(entry, 'quantity') else entry.get('quantity')
            
            if qty_to_invoice <= 0:
                continue
                
            # Find item in order
            target_item = next((i for i in order.items if i.product_sku == sku), None)
            if not target_item:
                raise ValidationException(f"Product {sku} not found in Order {order_number}")
                
            available_qty = target_item.quantity - target_item.invoiced_quantity
            if qty_to_invoice > available_qty:
                raise ValidationException(f"Cannot invoice {qty_to_invoice} of {sku}. Available: {available_qty}")
            
            # Create a copy for the invoice
            from app.models.sales import OrderItem
            invoice_item = OrderItem(**target_item.model_dump())
            invoice_item.quantity = qty_to_invoice
            invoice_item.invoiced_quantity = qty_to_invoice
            final_invoice_items.append(invoice_item)
            invoice_total += qty_to_invoice * target_item.unit_price
            
            # Update order record
            target_item.invoiced_quantity += qty_to_invoice

    if not final_invoice_items:
        raise ValidationException("No items selected for invoicing or everything is already invoiced.")

    if amount_paid > invoice_total:
        raise ValidationException(f"Amount paid (S/ {amount_paid}) cannot exceed invoice total (S/ {invoice_total})")
    
    # Generate Internal ID: FV-YY-####
    year_prefix = datetime.now().strftime('%y')
    prefix = f"FV-{year_prefix}"
    
    last_invoice = await SalesInvoice.find({"invoice_number": {"$regex": f"^{prefix}"}}).sort("-invoice_number").limit(1).to_list()
    
    new_num = 1
    if last_invoice and last_invoice[0].invoice_number:
        try:
            parts = last_invoice[0].invoice_number.split('-')
            if len(parts) == 3:
                new_num = int(parts[2]) + 1
        except (IndexError, ValueError):
            pass
        
    invoice_number = f"{prefix}-{new_num:04d}"
    
    invoice = SalesInvoice(
        invoice_number=invoice_number,
        sunat_number=sunat_number,
        order_number=order.order_number,
        customer_name=order.customer_name,
        customer_ruc=order.customer_ruc,
        invoice_date=datetime.fromisoformat(invoice_date),
        due_date=datetime.fromisoformat(due_date) if due_date else None,
        items=final_invoice_items,
        total_amount=round(invoice_total, 3),
        delivery_branch_name=order.delivery_branch_name,
        delivery_address=order.delivery_address,
        payment_status=payment_status,
        amount_paid=round(amount_paid, 3),
        amount_in_words=amount_in_words,
        payment_terms=payment_terms or order.payment_terms,
        issuer_info=issuer_info or order.issuer_info
    )
    
    if amount_paid > 0 and payment_date:
        payment = Payment(
            amount=round(amount_paid, 3),
            date=datetime.fromisoformat(payment_date),
            notes="Pago inicial al registrar factura"
        )
        invoice.payments.append(payment)
    
    await invoice.insert()
    
    # Update Order Status
    is_fully_invoiced = all(i.quantity == i.invoiced_quantity for i in order.items)
    if is_fully_invoiced:
        order.status = OrderStatus.INVOICED
    else:
        order.status = OrderStatus.PARTIALLY_INVOICED
        
    await order.save()

    if user:
        await AuditService.log_action(
            user=user,
            action="CREATE",
            module="SALES",
            description=f"Se emitió la Factura {invoice.sunat_number or invoice.invoice_number} vinculada a la orden {order_number} por un total de S/ {invoice.total_amount}",
            entity_id=str(invoice.id),
            entity_name=invoice.sunat_number or invoice.invoice_number
        )
    
    return invoice

async def delete_order(order_number: str, user: Optional[User] = None) -> bool:
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
        
    if user:
        await AuditService.log_action(
            user=user,
            action="DELETE",
            module="SALES",
            description=f"Se eliminó la Orden de Venta {order.order_number} que tenía un total de S/ {order.total_amount}",
            entity_id=str(order.id),
            entity_name=order.order_number
        )
        
    await order.delete()
    return True

async def delete_invoice(invoice_number: str, user: Optional[User] = None) -> bool:
    invoice = await SalesInvoice.find_one(SalesInvoice.invoice_number == invoice_number)
    if not invoice:
        raise NotFoundException("Invoice", invoice_number)
        
    if invoice.dispatch_status == "DISPATCHED":
        raise ValidationException("Cannot delete dispatched invoice. Return stock first.")

    # Revert order quantities if exists
    if invoice.order_number:
        order = await SalesOrder.find_one(SalesOrder.order_number == invoice.order_number)
        if order:
            # Restore invoiced quantities
            for inv_item in invoice.items:
                target_item = next((i for i in order.items if i.product_sku == inv_item.product_sku), None)
                if target_item:
                    target_item.invoiced_quantity = max(0, target_item.invoiced_quantity - inv_item.quantity)
            
            # Recalculate Order Status
            any_invoiced = any(i.invoiced_quantity > 0 for i in order.items)
            if not any_invoiced:
                order.status = OrderStatus.PENDING
            else:
                order.status = OrderStatus.PARTIALLY_INVOICED
                
            await order.save()
            
    if user:
        await AuditService.log_action(
            user=user,
            action="DELETE",
            module="SALES",
            description=f"Se eliminó la Factura {invoice.sunat_number or invoice.invoice_number} (Ref Orden: {invoice.order_number})",
            entity_id=str(invoice.id),
            entity_name=invoice.sunat_number or invoice.invoice_number
        )

    await invoice.delete()
    return True

# ==================== PAYMENTS ====================

async def register_payment(invoice_number: str, amount: float, payment_date: str, notes: str = None, user: Optional[User] = None) -> Dict[str, Any]:
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

    if user:
        await AuditService.log_action(
            user=user,
            action="UPDATE",
            module="FINANCE",
            description=f"Se registró un pago de S/ {amount} para la factura {invoice.sunat_number or invoice.invoice_number}. Estado: {invoice.payment_status}",
            entity_id=str(invoice.id),
            entity_name=invoice.sunat_number or invoice.invoice_number
        )

    return {"message": "Payment registered successfully", "invoice": invoice}

# ==================== CUSTOMERS ====================

async def get_customers() -> List[Dict[str, Any]]:
    customers = await Customer.find_all().to_list()
    
    # Pre-fetch all linked users to avoid N+1 queries
    users = await User.find(User.ruc_linked != None).to_list()
    user_map = {u.ruc_linked: u for u in users}
    
    results = []
    for c in customers:
        try:
            # Use model_dump if available (Pydantic v2), otherwise dict()
            if hasattr(c, "model_dump"):
                data = c.model_dump()
            else:
                data = c.dict()
            
            # CRITICAL: Convert all PydanticObjectId to strings to avoid serialization errors
            # Beanie models have 'id' which Pydantic includes in dict/model_dump
            if "id" in data:
                data["id"] = str(data["id"])
            
            # The frontend specifically looks for _id
            data["_id"] = str(c.id)
            
            # Manually convert datetime fields to ISO strings
            if isinstance(data.get("created_at"), datetime):
                data["created_at"] = data["created_at"].isoformat()
            
            # Convert branches IDs if they exist
            if "branches" in data and data["branches"]:
                for branch in data["branches"]:
                    # If branch is a dict (from model_dump), check for id
                    if isinstance(branch, dict) and "id" in branch:
                         branch["id"] = str(branch["id"])
            
            linked_user = user_map.get(c.ruc)
            if linked_user:
                data["loyalty_points"] = getattr(linked_user, 'loyalty_points', 0)
                data["internal_points_local"] = getattr(linked_user, 'internal_points_local', 0)
                data["linked_user_id"] = str(linked_user.id)
            else:
                data["loyalty_points"] = 0
                data["internal_points_local"] = 0
                data["linked_user_id"] = None
                
            results.append(data)
        except Exception as e:
            continue
        
    return results

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
    customer.classification = customer_data.classification
    customer.custom_discount_percent = customer_data.custom_discount_percent
    
    # Ensure branches is at least an empty list
    customer.branches = customer_data.branches if customer_data.branches is not None else []
    
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

async def create_dispatch_guide(invoice_number: str, notes: str, created_by: str, sunat_number: Optional[str] = None, issuer_info: Optional[Dict[str, Any]] = None, user: Optional[User] = None) -> Dict[str, Any]:
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
            unit_cost=product.cost,
            weight_g=getattr(product, 'weight_g', 0.0) # Capturamos el peso del producto
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
    
    if user:
        await AuditService.log_action(
            user=user,
            action="CREATE",
            module="INVENTORY",
            description=f"Se generó la Guía de Remisión {guide.sunat_number or guide.guide_number} para la factura {invoice_number}",
            entity_id=str(guide.id),
            entity_name=guide.sunat_number or guide.guide_number
        )
    
    return {
        "message": "Dispatch guide created successfully",
        "guide_number": guide_number,
        "items_count": len(guide_items),
        "delivery_address": invoice.delivery_address
    }
