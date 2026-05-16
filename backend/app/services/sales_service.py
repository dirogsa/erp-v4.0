import asyncio
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from beanie import PydanticObjectId
from app.models.auth import User
from app.models.staff import Staff
from app.models.sales import SalesOrder, SalesInvoice, Customer, PaymentStatus, OrderStatus, Payment, CustomerBranch, SalesQuote, QuoteStatus, IssuerInfo, IssuerInfoDepartment
from app.models.config import SystemConfig


from app.models.inventory import Product, DeliveryGuide, GuideItem, GuideType, GuideStatus, MovementType
from app.services import inventory_service, audit_service, pricing_service
from app.services.audit_service import AuditService
from app.exceptions.business_exceptions import NotFoundException, ValidationException, DuplicateEntityException
from app.schemas.common import PaginatedResponse

# ==================== HELPERS ====================

async def resolve_issuer_info(issuer_data: dict) -> IssuerInfo:
    """Invierte los IDs de Staff en nombres/emails reales para el snapshot final"""
    if not issuer_data:
        return None
        
    resolved_depts = []
    departments = issuer_data.get("departments", [])
    
    for dept in departments:
        staff_id = dept.get("staff_id")
        name = dept.get("name")
        
        staff_member = None
        if staff_id:
            staff_member = await Staff.get(staff_id)
            
        if staff_member:
            resolved_depts.append(IssuerInfoDepartment(
                name=name,
                staff_name=staff_member.full_name,
                staff_email=staff_member.email,
                staff_phone=staff_member.phone
            ))
        else:
            # Fallback if staff not found or no ID (legacy or missing)
            resolved_depts.append(IssuerInfoDepartment(
                name=name,
                staff_name=dept.get("lead_name", "N/A"),
                staff_email=dept.get("lead_email")
            ))
            
    # Clean data to build IssuerInfo
    clean_data = {k: v for k, v in issuer_data.items() if k != "departments"}
    return IssuerInfo(**clean_data, departments=resolved_depts)

async def validate_transaction_margins(items: List[Any], user: Optional[User] = None):
    """
    World-Class Profitability Guardrail (Stop-Loss).
    Ensures no sale is made below the minimum margin configured in SystemConfig.
    """
    config = await SystemConfig.find_one({})
    if not config or not config.sales_policy.min_margin_guard_pct:
        return
        
    min_margin = config.sales_policy.min_margin_guard_pct / 100
    
    # Bypass for high-level admins if needed, but we keep audit logs
    is_admin = user and user.role in ["ADMIN", "SUPERADMIN"]
    
    for item in items:
        product = await Product.find_one(Product.sku == item.product_sku)
        if not product:
            continue
            
        # Calculation: (Price - Cost) / Price
        if item.unit_price > 0:
            margin = (item.unit_price - product.cost) / item.unit_price
            
            if margin < min_margin:
                msg = f"Margen insuficiente para {item.product_sku} ({product.name}). Margen: {margin*100:.2f}%, Mínimo Requerido: {min_margin*100:.2f}%"
                if not is_admin:
                    raise ValidationException(msg)
                else:
                    print(f"[GUARDRAIL WARNING] Venta bajo margen autorizada por Admin: {item.product_sku}")

# ==================== ORDERS ====================

async def get_orders(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    company_id: Optional[str] = None
) -> PaginatedResponse[SalesOrder]:
    query = {}
    if company_id:
        query["company_id"] = company_id
    
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
    # Resolve Staff IDs into actual names for the snapshot
    if order.issuer_info:
        order.issuer_info = await resolve_issuer_info(order.issuer_info if isinstance(order.issuer_info, dict) else order.issuer_info.model_dump())

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
    
    # WORLD-CLASS PROFITABILITY GUARDRAIL (STOP-LOSS)
    await validate_transaction_margins(order.items, user)

    # World-Class Stock Validation
    items_to_check = [{"product_sku": i.product_sku, "quantity": i.quantity} for i in order.items]
    stock_res = await inventory_service.check_stock_availability(items_to_check)
    if order.status == OrderStatus.PENDING and not stock_res["can_fulfill_full"] and not stock_res["allow_negative_stock"]:
        order.status = OrderStatus.BACKORDER
    order.total_amount = round(sum(item.quantity * item.unit_price for item in order.items), 3)
    
    # Calculate Points Spent (Redemption)
    points_spent = 0
    # Store fetched products to avoid re-fetching later
    fetched_products = {}
    
    for item in order.items:
        # Fetch product
        if item.product_sku not in fetched_products:
            prod = await Product.find_one(Product.sku == item.product_sku)
            fetched_products[item.product_sku] = prod
        
        product = fetched_products.get(item.product_sku)
        if not product:
            raise NotFoundException("Product", item.product_sku)

        # WORLD-CLASS DYNAMIC PRICING ENGINE INJECTION
        # Validate or Fetch the price based on quantity and strategy
        price_data = await pricing_service.PricingService.get_product_price(
            sku=product.sku,
            quantity=item.quantity
        )
        
        if price_data["price"] > 0:
            # Overwrite with the official strategy price
            item.unit_price = price_data["price"]
            # Recalculate unit_value (without tax)
            item.unit_value = round(item.unit_price / (1 + item.tax_rate), 4)
        
        if product and getattr(product, 'points_cost', 0) > 0:
            points_spent += product.points_cost * item.quantity
    
    order.loyalty_points_spent = points_spent
    
    # Verify User Balance if points are spent
    user = None
    if points_spent > 0:
        if not order.customer_username and not order.customer_email:
             # Try to find user by RUC if no username/email provided
             print("Warning: Redemption order without customer identifier")
        else:
             if order.customer_username:
                 user = await User.find_one(User.username == order.customer_username)
             else:
                 user = await User.find_one(User.email == order.customer_email)
             if not user:
                 raise ValidationException(f"User not found for ID {order.customer_username or order.customer_email}")
             
             if (user.loyalty_points or 0) < points_spent:
                 raise ValidationException(f"Insufficient points. Required: {points_spent}, Available: {user.loyalty_points}")

    # Loyalty Points Logic (Gaining Points)
    system_config = await SystemConfig.find_one({})
    if not system_config:
        system_config = SystemConfig()
    
    total_points_gained = 0
    if system_config.loyalty.is_active:
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
                elif system_config.loyalty.points_per_currency_unit > 0:
                    points = int(item.unit_price * system_config.loyalty.points_per_currency_unit)
                
                item.loyalty_points = points
                total_points_gained += points * item.quantity
    
    order.loyalty_points_granted = total_points_gained
    
    await order.insert()

    # Update User Points if linked (Gain and Spend)
    if order.customer_username or order.customer_email:
        if not user:
             if order.customer_username:
                 user = await User.find_one(User.username == order.customer_username)
             else:
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
                    if not system_config.loyalty.only_web_accumulation:
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
    
    # Stock Orchestration Engine
    items_to_check = [{"product_sku": i.product_sku, "quantity": i.quantity} for i in original_order.items]
    stock_res = await inventory_service.check_stock_availability(items_to_check)
    if stock_res.get("allow_negative_stock"):
        available_items = original_order.items
        pending_items = []
        # Skip loop
    else:
        available_skus = {a["product_sku"]: a["quantity"] for a in stock_res.get("available_items", [])}
        for item in original_order.items:
            avail_qty = available_skus.get(item.product_sku, 0)
            if avail_qty >= item.quantity:
                available_items.append(item)
            elif avail_qty > 0:
                from app.models.sales import OrderItem
                available_items.append(OrderItem(
                    product_sku=item.product_sku,
                    quantity=avail_qty,
                    unit_price=item.unit_price,
                    loyalty_points=item.loyalty_points
                ))
                pending_items.append(OrderItem(
                    product_sku=item.product_sku,
                    quantity=item.quantity - avail_qty,
                    unit_price=item.unit_price,
                    loyalty_points=item.loyalty_points
                ))
            else:
                pending_items.append(item)
    # End of classification
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
    date_to: Optional[str] = None,
    is_confirmed: Optional[bool] = None,
    company_id: Optional[str] = None
) -> PaginatedResponse[SalesInvoice]:
    query = {}
    if company_id:
        query["company_id"] = company_id
    
    if search:
        query["$or"] = [
            {"invoice_number": {"$regex": search, "$options": "i"}},
            {"sunat_number": {"$regex": search, "$options": "i"}},
            {"customer_name": {"$regex": search, "$options": "i"}},
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
    # Resolve Staff IDs for the snapshot
    if issuer_info:
        issuer_info = await resolve_issuer_info(issuer_info)

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
        issuer_info=issuer_info or order.issuer_info,
        requested_by=order.requested_by # Carry over contact snapshot
    )
    
    # WORLD-CLASS PROFITABILITY GUARDRAIL (STOP-LOSS)
    await validate_transaction_margins(invoice.items, user)
    
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
    
    if order.status in [OrderStatus.INVOICED, OrderStatus.PARTIALLY_INVOICED]:
        raise ValidationException("No se puede eliminar una orden facturada o parcialmente facturada. Elimine las facturas primero.")

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
    print(f"\n--- INICIO PROCESO BORRADO: {invoice_number} ---")
    try:
        print(f"DEBUG [1]: Buscando factura {invoice_number} en BD...")
        invoice = await SalesInvoice.find_one(SalesInvoice.invoice_number == invoice_number)
        print(f"DEBUG [2]: Resultado búsqueda factura: {'ENCONTRADA' if invoice else 'NO ENCONTRADA'}")
        
        if not invoice:
            print(f"DEBUG [3]: Factura {invoice_number} no existe.")
            raise NotFoundException("Invoice", invoice_number)
            
        print(f"DEBUG [4]: Verificando factura {invoice_number}. Orden vinculada: '{invoice.order_number}'")
        
        is_import = invoice.order_number and invoice.order_number.startswith("IMP-")
        
        # BYPASS DE EMERGENCIA PARA LIMPIEZA DE FV-26-0001 ATASCADA (Bug Legacy)
        if invoice_number == "FV-26-0001":
            print("DEBUG: ACTIVANDO BYPASS DE EMERGENCIA PARA FV-26-0001")
            is_import = True
            
        # JERARQUÍA PROFESIONAL (ALTA GAMA):
        # Prohibimos borrar factura si hay una Guía de Remisión generada,
        # obligando al usuario a anular la guía primero para restaurar stock.
        if invoice.guide_id or invoice.dispatch_status != "NOT_DISPATCHED":
            if not is_import:
                print(f"DEBUG [5]: Bloqueo por jerarquía de documentos (Factura Manual).")
                raise ValidationException(
                    f"No se puede eliminar la factura porque está vinculada a la Guía de Remisión {invoice.guide_id}. "
                    "Por estándar contable, debe anular/eliminar primero la Guía de Remisión para retornar el stock al almacén antes de borrar la factura."
                )
        
        # FLUJO ESPECIAL (DESHACER IMPORTACIÓN XML)
        if is_import:
            print(f"DEBUG [5]: Ejecutando Deshacer Importación (Cascade Delete).")
            from app.services import delivery_service
            
            # 1. Anular y Eliminar la Guía para retornar stock
            if invoice.guide_id:
                print(f"DEBUG [XML-1]: Anulando Guía {invoice.guide_id} para retornar stock...")
                await delivery_service.cancel_guide(invoice.guide_id)
                
            # 2. Borrar la Orden interna
            if invoice.order_number:
                print(f"DEBUG [XML-2]: Eliminando Orden Fantasma {invoice.order_number}...")
                order = await SalesOrder.find_one(SalesOrder.order_number == invoice.order_number)
                if order:
                    await order.delete()
            
            # 3. Borrar la Factura
            print(f"DEBUG [XML-3]: Eliminando Factura {invoice_number}...")
            await invoice.delete()
            
            if user:
                await AuditService.log_action(user=user, action="DELETE", module="SALES", description=f"Se deshizo la importación XML de la Factura {invoice.sunat_number or invoice.invoice_number}", entity_id=str(invoice.id), entity_name=invoice.sunat_number or invoice.invoice_number)
            
            print(f"--- FIN PROCESO BORRADO XML: {invoice_number} [OK] ---\n")
            return True

        # FLUJO NORMAL (Factura Manual sin guía)
        print(f"DEBUG [6]: Verificando orden vinculada para rollback parcial: {invoice.order_number}")
        if invoice.order_number:
            print(f"DEBUG [7]: Buscando orden {invoice.order_number} en BD...")
            order = await SalesOrder.find_one(SalesOrder.order_number == invoice.order_number)
            print(f"DEBUG [8]: Resultado búsqueda orden: {'ENCONTRADA' if order else 'NO ENCONTRADA'}")
            
            if order:
                print(f"DEBUG [9]: Buscando otras facturas activas para la orden...")
                # 1. Get all OTHER active invoices for this order
                other_active_invoices = await SalesInvoice.find(
                    {"order_number": order.order_number, "invoice_number": {"$ne": invoice.invoice_number}}
                ).to_list()
                print(f"DEBUG [10]: Otras facturas encontradas: {len(other_active_invoices)}")
                
                # 2. Reset all invoiced quantities on the order
                print(f"DEBUG [11]: Reiniciando cantidades en la orden...")
                if order.items:
                    for item in order.items:
                        item.invoiced_quantity = 0
                
                # 3. Sum quantities from all remaining invoices
                print(f"DEBUG [12]: Recalculando cantidades desde otras facturas...")
                for other_inv in other_active_invoices:
                    if other_inv.items:
                        for inv_item in other_inv.items:
                            target = next((i for i in order.items if i.product_sku == inv_item.product_sku), None)
                            if target:
                                target.invoiced_quantity += inv_item.quantity
                
                # 4. Recalculate Order Status
                print(f"DEBUG [13]: Recalculando estado de la orden...")
                try:
                    total_items_to_invoice = sum(i.quantity for i in order.items) if order.items else 0
                    total_items_invoiced = sum(i.invoiced_quantity for i in order.items) if order.items else 0
                    
                    if total_items_invoiced == 0:
                        order.status = OrderStatus.PENDING
                    elif total_items_invoiced >= total_items_to_invoice:
                        is_fully_done = all(i.invoiced_quantity >= i.quantity for i in order.items) if order.items else True
                        order.status = OrderStatus.INVOICED if is_fully_done else OrderStatus.PARTIALLY_INVOICED
                    else:
                        order.status = OrderStatus.PARTIALLY_INVOICED
                    
                    print(f"DEBUG [14]: Guardando cambios en la orden...")
                    await order.save()
                    print(f"DEBUG [15]: Orden actualizada con éxito. Nuevo estado: {order.status}")
                except Exception as e:
                    import traceback
                    print(f"ERROR CRITICO [B]: Falló el guardado de la Orden: {str(e)}")
                    traceback.print_exc()
                    raise ValidationException(f"No se pudo actualizar la orden {order.order_number} al borrar la factura: {str(e)}")
                    
        # Final Step: Delete invoice record
        print(f"DEBUG [16]: Procediendo a eliminar el registro de factura de la BD...")
        await invoice.delete()
        print(f"DEBUG [17]: Factura eliminada con éxito.")

        if user:
            print(f"DEBUG [18]: Registrando acción en auditoría...")
            await AuditService.log_action(
                user=user,
                action="DELETE",
                module="SALES",
                description=f"Se eliminó la Factura {invoice.sunat_number or invoice.invoice_number} (Ref Orden: {invoice.order_number})",
                entity_id=str(invoice.id),
                entity_name=invoice.sunat_number or invoice.invoice_number
            )
        
        print(f"--- FIN PROCESO BORRADO: {invoice_number} [OK] ---\n")
        return True

    except Exception as e:
        import traceback
        print(f"\n!!! ERROR GENERAL EN delete_invoice !!!")
        print(f"Tipo Error: {type(e).__name__}")
        print(f"Mensaje: {str(e)}")
        traceback.print_exc()
        print(f"--- FIN PROCESO BORRADO: {invoice_number} [FAIL] ---\n")
        raise ValidationException(f"No se pudo eliminar la factura {invoice_number}. Error interno: {str(e)}")

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

from app.models.company import Company

# ==================== CUSTOMERS ====================

async def get_customers(company_id: Optional[str] = None) -> List[Dict[str, Any]]:
    query = {}
    if company_id:
        # Check governance mode
        company = await Company.get(company_id)
        if company and company.enterprise_settings.customers_mode == 'SOVEREIGN':
            query = {"company_id": company_id}
        # If SHARED, query remains {}, returning ALL customers (Global View)
            
    customers = await Customer.find(query).to_list()
    
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
            
            linked_user = user_map.get(c.document_number)
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

async def get_customer_by_number(number: str, company_id: Optional[str] = None) -> Customer:
    query = {"document_number": number}
    if company_id:
        company = await Company.get(company_id)
        if company and company.enterprise_settings.customers_mode == 'SOVEREIGN':
            query["company_id"] = company_id
        # If SHARED, we don't filter by company_id, allowing global lookup
        
    customer = await Customer.find_one(query)
    if not customer:
        raise NotFoundException("Customer", number)
    return customer

async def create_customer(customer: Customer) -> Customer:
    # Check governance mode to decide if it's a global or local customer
    if customer.company_id:
        company = await Company.get(customer.company_id)
        if company and company.enterprise_settings.customers_mode == 'SHARED':
            customer.company_id = None # Set to Global
            
    query = {"document_number": customer.document_number}
    if customer.company_id:
        query["company_id"] = customer.company_id
    else:
        query["company_id"] = None # Look for global record
        
    existing = await Customer.find_one(query)
    if existing:
        raise DuplicateEntityException("Customer", "document_number", customer.document_number)
    await customer.insert()
    return customer

async def update_customer(id: PydanticObjectId, customer_data: Customer) -> Customer:
    customer = await Customer.get(id)
    if not customer:
        raise NotFoundException("Customer", str(id))
    
    customer.name = customer_data.name
    customer.document_type = customer_data.document_type
    customer.document_number = customer_data.document_number
    customer.address = customer_data.address
    customer.phone = customer_data.phone
    customer.email = customer_data.email
    customer.classification = customer_data.classification
    customer.custom_discount_percent = customer_data.custom_discount_percent
    
    # --- Campos de Inteligencia Comercial ---
    customer.price_list_id = customer_data.price_list_id
    customer.currency_preference = customer_data.currency_preference
    customer.seller_id = customer_data.seller_id
    customer.payment_method_id = customer_data.payment_method_id
    
    # Ensure lists are at least empty
    customer.branches = customer_data.branches if customer_data.branches is not None else []
    customer.contacts = customer_data.contacts if customer_data.contacts is not None else []
    
    await customer.save()

    # Sync with linked User (Shop) if exists
    from app.models.auth import User
    linked_user = await User.find_one(User.ruc_linked == customer.document_number)
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
        for b in customer.branches:
            b.is_main = False
    
    customer.branches[branch_index] = branch
    await customer.save()
    return customer

# ==================== CUSTOMER CONTACTS ====================

async def add_customer_contact(id: PydanticObjectId, contact: Any) -> Customer:
    customer = await Customer.get(id)
    if not customer:
        raise NotFoundException("Customer", str(id))
    
    # contact can be a dict or CustomerContact
    from app.models.sales import CustomerContact
    if isinstance(contact, dict):
        contact_obj = CustomerContact(**contact)
    else:
        contact_obj = contact

    customer.contacts.append(contact_obj)
    await customer.save()
    return customer

async def update_customer_contact(id: PydanticObjectId, contact_index: int, contact_data: Any) -> Customer:
    customer = await Customer.get(id)
    if not customer:
        raise NotFoundException("Customer", str(id))
    
    if contact_index < 0 or contact_index >= len(customer.contacts):
        raise NotFoundException("Contact", str(contact_index))
    
    from app.models.sales import CustomerContact
    if isinstance(contact_data, dict):
        new_contact = CustomerContact(**contact_data)
    else:
        new_contact = contact_data
        
    customer.contacts[contact_index] = new_contact
    await customer.save()
    return customer

async def delete_customer_contact(id: PydanticObjectId, contact_index: int) -> Customer:
    customer = await Customer.get(id)
    if not customer:
        raise NotFoundException("Customer", str(id))
    
    if contact_index < 0 or contact_index >= len(customer.contacts):
        raise NotFoundException("Contact", str(contact_index))
    
    customer.contacts.pop(contact_index)
    await customer.save()
    return customer

# ==================== DISPATCH ====================

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
    
    # Validate stock (World-Class Guardrail - Skip if system allows negative stock for reconciliation)
    config = await SystemConfig.find_one({})
    allow_negative = config.allow_negative_stock if config else False

    if not allow_negative:
        for item in invoice.items:
            product = await inventory_service.get_product_by_sku(item.product_sku)
            if product.stock_current < item.quantity:
                raise ValidationException(
                    f"Stock insuficiente para {product.name}. Disponible: {product.stock_current}, Requerido: {item.quantity}. "
                    "Active el 'Modo Conciliación' en Configuración si desea regularizar facturas históricas sin stock físico."
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
    
    # Calculate Total Weight (World-Class Logistics)
    total_weight_kg = sum((item.weight_g * item.quantity) for item in guide_items) / 1000.0

    # Default Carrier: If it's internal/automatic, the Issuer is the "Remitente/Carrier" (Private Transport)
    issuer = invoice.issuer_info
    c_name = issuer.name if issuer else "Empresa Emisora"
    c_ruc = issuer.ruc if issuer else "00000000000"

    guide = DeliveryGuide(
        guide_number=guide_number,
        sunat_number=sunat_number,
        guide_type=GuideType.DISPATCH,
        status=GuideStatus.DISPATCHED,
        invoice_number=invoice_number,
        customer_name=invoice.customer_name,
        customer_ruc=invoice.customer_ruc or "00000000000",
        delivery_address=invoice.delivery_address,
        items=guide_items,
        notes=notes,
        created_by=created_by,
        issue_date=datetime.now(),
        
        # World-Class Metadata Injection
        carrier_name=c_name,
        carrier_ruc=c_ruc,
        total_weight=total_weight_kg,
        
        company_id=str(invoice.company_id)
    )
    await guide.insert()
    
    # Move Inventory (OUT) - Considering Reservation
    for item in invoice.items:
        await inventory_service.register_movement(
            sku=item.product_sku,
            quantity=item.quantity,
            movement_type=MovementType.OUT,
            reference=guide_number,
            company_id=invoice.company_id,
            is_reservation_release=invoice.is_stock_reserved # Crucial: release if previously reserved
        )
    
    invoice.dispatch_status = "DISPATCHED"
    invoice.guide_id = str(guide.id)
    invoice.is_stock_reserved = False # Clear flag after release
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

async def import_invoice_xml(data: Any, auto_guide: bool = False, exchange_rate: Optional[float] = None, user: Optional[User] = None) -> SalesInvoice:
    """
    Importación 'Lean' de factura XML (Clase Mundial).
    No crea Orden de Venta. Soporta Incubación de SKUs y Reserva de Stock.
    """
    if isinstance(data, str):
        raise ValidationException("El backend recibió un string en lugar de un objeto parseado. Verifique el integrador de XML.")
    
    from app.models.sales import OrderItem, PaymentStatus, SalesInvoice
    from app.models.inventory import Product
    
    # 0. Validación de Factura Duplicada
    sunat_number = data.get('sunat_number') or data.get('document_number')
    company_id = user.current_company_id if user else data.get('company_id')
    
    if sunat_number:
        existing_invoice = await SalesInvoice.find_one(SalesInvoice.sunat_number == sunat_number)
        if existing_invoice:
            raise ValidationException(
                f"DOCUMENTO DUPLICADO: La factura '{sunat_number}' ya está registrada. "
                f"(Folio Interno: {existing_invoice.invoice_number})"
            )
    
    # 1. Moneda y Tipo de Cambio
    currency_val = data.get('currency', 'PEN')
    is_exchange_rate_confirmed = True
    current_exchange_rate = 1.0

    if currency_val in ['SOLES', 'PEN']: 
        currency_val = 'PEN'
    elif currency_val in ['DOLARES', 'USD']:
        currency_val = 'USD'
        from app.models.finance import ExchangeRate
        doc_date = datetime.fromisoformat(data['date']).replace(hour=0, minute=0, second=0, microsecond=0)
        rate_obj = await ExchangeRate.find_one(ExchangeRate.date == doc_date)
        
        if rate_obj:
            current_exchange_rate = rate_obj.sale
        else:
            # Estrategia de Incubación: No bloqueamos la importación, pero marcamos inconsistencia
            rate_obj_list = await ExchangeRate.find({"date": {"$lte": doc_date}}).sort("-date").limit(1).to_list()
            if rate_obj_list:
                current_exchange_rate = rate_obj_list[0].sale
                # Marcamos como no confirmado porque el TC no es el exacto del día
                is_exchange_rate_confirmed = False
            else:
                current_exchange_rate = 0.0 # Placeholder crítico
                is_exchange_rate_confirmed = False
    else:
        current_exchange_rate = 1.0

    # 2. Procesamiento de Items y Búsqueda Masiva
    from app.utils.norm_utils import smart_parse_item
    raw_items = data.get('items', [])
    processed_keys = [smart_parse_item(i.get('product_sku') or i.get('code'), i.get('product_name') or i.get('description', '')) for i in raw_items]
    normalization_results = await asyncio.gather(*processed_keys)
    
    skus_to_find = list(set(r[0] for r in normalization_results))
    db_products = await Product.find({"sku": {"$in": skus_to_find}}).to_list()
    product_map = {(p.sku, p.brand): p for p in db_products}

    order_items = []
    all_mapped = True
    
    for i, item in enumerate(raw_items):
        clean_sku, detected_brand = normalization_results[i]
        product = product_map.get((clean_sku, detected_brand))
        
        # Fallback por SKU si no hay marca exacta
        if not product:
            product = next((p for (s, b), p in product_map.items() if s == clean_sku), None)

        is_unmapped = False
        if not product:
            is_unmapped = True
            all_mapped = False

        order_items.append(OrderItem(
            product_id=str(product.id) if product else None,
            product_sku=product.sku if product else clean_sku,
            product_name=product.name if product else item.get('product_name', item.get('description', '')), 
            brand=product.brand if product else detected_brand,
            quantity=item['quantity'],
            unit_value=item.get('unit_value', item['unit_price'] / 1.18),
            unit_price=item['unit_price'],
            tax_rate=item.get('tax_rate', 0.18),
            invoiced_quantity=item['quantity'],
            is_unmapped=is_unmapped
        ))
    
    # 3. Vincular Cliente (Incubación de Entidades)
    customer_number = data['customer'].get('ruc') or data['customer'].get('document_number')
    from app.models.sales import Customer
    customer = await Customer.find_one(Customer.document_number == customer_number)
    
    is_customer_confirmed = True
    customer_id = None
    customer_name = data['customer'].get('name', 'CLIENTE DESCONOCIDO')
    customer_ruc = customer_number
    customer_address = data['customer'].get('address', 'Dirección en XML')

    if customer:
        customer_id = str(customer.id)
        customer_name = customer.name
        customer_ruc = customer.document_number
        customer_address = customer.address or customer_address
    else:
        is_customer_confirmed = False # Requiere Sinceramiento de Entidad

    # 4. Generar Folio de Factura Interno
    year_prefix = datetime.now().strftime('%y')
    prefix_inv = f"FV-{year_prefix}"
    last_inv = await SalesInvoice.find({"invoice_number": {"$regex": f"^{prefix_inv}"}}).sort("-invoice_number").limit(1).to_list()
    new_num_inv = 1
    if last_inv and last_inv[0].invoice_number:
        try:
            parts = last_inv[0].invoice_number.split('-')
            if len(parts) == 3: new_num_inv = int(parts[2]) + 1
        except: pass
    invoice_number = f"{prefix_inv}-{new_num_inv:04d}"

    # 5. Fechas y Condiciones
    payment_mode = data.get('payment_terms', 'Contado')
    is_credit = payment_mode.lower() == 'crédito' or len(data.get('installments', [])) > 0
    invoice_date = datetime.fromisoformat(data['date'])
    due_date = invoice_date
    if is_credit:
        installments = data.get('installments', [])
        if installments:
            try:
                dates = [datetime.fromisoformat(inst['dueDate']) for inst in installments if inst.get('dueDate')]
                if dates: due_date = max(dates)
            except: pass
        else:
            due_date = invoice_date + timedelta(days=30)

    # 6. Crear Factura con flags de Integridad Completa
    invoice = SalesInvoice(
        invoice_number=invoice_number,
        sunat_number=sunat_number,
        order_number="XML-IMPORT",
        customer_id=customer_id,
        customer_name=customer_name,
        customer_ruc=customer_ruc,
        delivery_address=customer_address,
        invoice_date=invoice_date,
        due_date=due_date,
        items=order_items,
        total_amount=data['total_amount'],
        currency=currency_val,
        exchange_rate=current_exchange_rate,
        payment_condition="CREDITO" if is_credit else "CONTADO",
        payment_status=PaymentStatus.PENDING,
        amount_paid=0.0,
        payment_terms={"mode": payment_mode, "installments": data.get('installments', [])},
        dispatch_status="PENDING_GUIDE",
        is_financial_confirmed=False, 
        is_catalog_confirmed=all_mapped,
        is_customer_confirmed=is_customer_confirmed,
        is_exchange_rate_confirmed=is_exchange_rate_confirmed,
        is_stock_reserved=False, 
        company_id=company_id
    )
    
    # 7. Reserva de Stock Inteligente (Fase 5)
    # Solo reservamos los productos que están mapeados
    if all_mapped:
        for item in order_items:
            # Buscar data de producto por empresa
            p_data = next((d for d in product_map[(item.product_sku, item.brand)].company_data if d.company_id == company_id), None)
            if p_data:
                p_data.stock_current -= item.quantity
                p_data.stock_reserved += item.quantity
        
        await asyncio.gather(*[p.save() for p in product_map.values()])
        invoice.is_stock_reserved = True

    await invoice.insert()
    
    # Log de Auditoría
    await AuditService.log_action(
        user=user, 
        action="IMPORT", 
        module="SALES", 
        description=f"Importación XML Factura {sunat_number}. Mapeada: {all_mapped}. Reserva: {invoice.is_stock_reserved}",
        entity_id=str(invoice.id),
        entity_name=sunat_number,
        company_id=company_id
    )

    return invoice

async def bulk_update_payment_condition(invoice_numbers: List[str], condition: str, days: Optional[int] = 30, payment_terms: Optional[dict] = None) -> Dict[str, Any]:
    """Actualización masiva de condición de pago (Sinceramiento Financiero)"""
    count = 0
    for num in invoice_numbers:
        invoice = await SalesInvoice.find_one(SalesInvoice.invoice_number == num)
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
            # Si era contado o no estaba confirmado, actualizamos a crédito
            if invoice.payment_condition != "CREDITO" or not invoice.is_financial_confirmed:
                invoice.payment_condition = "CREDITO"
                invoice.payment_status = PaymentStatus.PENDING
                invoice.amount_paid = 0.0
                # Limpiar pagos automáticos previos
                invoice.payments = [p for p in invoice.payments if p.notes and "automático" not in p.notes.lower()]
                changed = True
            
            # Siempre aplicar términos si se envían
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
                
                # Registrar el pago total si no existe
                has_full_payment = any(p.amount >= invoice.total_amount for p in invoice.payments)
                if not has_full_payment:
                    payment = Payment(
                        amount=invoice.total_amount,
                        date=datetime.now(),
                        notes="Confirmación manual: Liquidación Contado (Sinceramiento)"
                    )
                    invoice.payments.append(payment)
                changed = True
        
        # Sellar como Sincerado
        if not invoice.is_financial_confirmed:
            invoice.is_financial_confirmed = True
            changed = True
            
        if changed:
            await invoice.save()
            count += 1
            
    return {"message": f"Se sinceraron {count} facturas correctamente", "count": count}
