from typing import List, Optional, Dict, Any
from datetime import datetime
from beanie import PydanticObjectId
from app.models.sales import SalesQuote, QuoteStatus, SalesOrder, OrderStatus, OrderItem
from app.services.sales_service import resolve_issuer_info
from app.services import sales_service, inventory_service
from app.models.inventory import Product
from app.models.config import SystemConfig
from app.exceptions.business_exceptions import NotFoundException, ValidationException
from app.schemas.common import PaginatedResponse

async def get_quotes(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    status: Optional[str] = None,
    source: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
) -> PaginatedResponse[SalesQuote]:

    query = {}
    
    if search:
        query["$or"] = [
            {"quote_number": {"$regex": search, "$options": "i"}},
            {"customer_name": {"$regex": search, "$options": "i"}},
            {"external_reference": {"$regex": search, "$options": "i"}}
        ]
    
    if status:
        query["status"] = status
    
    if source:
        query["source"] = source

    if date_from or date_to:
        query["date"] = {}
        if date_from:
            query["date"]["$gte"] = datetime.fromisoformat(date_from)
        if date_to:
            query["date"]["$lte"] = datetime.fromisoformat(date_to)

    total = await SalesQuote.find(query).count()
    items = await SalesQuote.find(query).sort("-date").skip(skip).limit(limit).to_list()
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=skip // limit + 1,
        pages=(total + limit - 1) // limit,
        size=limit
    )

async def get_quote(quote_number: str) -> SalesQuote:
    quote = await SalesQuote.find_one(SalesQuote.quote_number == quote_number)
    if not quote:
        raise NotFoundException("Quote", quote_number)
    return quote

async def create_quote(quote: SalesQuote) -> SalesQuote:
    # Resolve Staff IDs for the snapshot
    if quote.issuer_info:
        quote.issuer_info = await resolve_issuer_info(quote.issuer_info if isinstance(quote.issuer_info, dict) else quote.issuer_info.model_dump())

    # Generate Sequential Quote Number: CV-YY-####
    year_prefix = datetime.now().strftime('%y')
    prefix = f"CV-{year_prefix}"
    
    last_quote = await SalesQuote.find({"quote_number": {"$regex": f"^{prefix}"}}).sort("-quote_number").limit(1).to_list()
    
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
    quote.total_amount = round(sum(item.quantity * item.unit_price for item in quote.items), 3)
    quote.status = QuoteStatus.DRAFT

    # Snapshot loyalty points using Sovereignty Hub
    system_config = await SystemConfig.find_one({})
    if not system_config:
        system_config = SystemConfig()

    for item in quote.items:
        try:
            product = await inventory_service.get_product_by_sku(item.product_sku)
            if product and product.loyalty_points > 0:
                item.loyalty_points = product.loyalty_points
            elif system_config.loyalty.is_active and system_config.loyalty.points_per_currency_unit > 0:
                item.loyalty_points = int(item.unit_price * system_config.loyalty.points_per_currency_unit)
            else:
                item.loyalty_points = 0
        except Exception:
             item.loyalty_points = 0
    
    await quote.insert()
    return quote

async def update_quote(quote_number: str, quote_data: SalesQuote) -> SalesQuote:
    quote = await get_quote(quote_number)
    
    if quote.status in [QuoteStatus.ACCEPTED, QuoteStatus.CONVERTED, QuoteStatus.REJECTED]:
        raise ValidationException("No se puede actualizar una cotización finalizada")
    
    quote.customer_name = quote_data.customer_name
    quote.customer_ruc = quote_data.customer_ruc
    quote.items = quote_data.items
    quote.date = quote_data.date
    quote.valid_until = quote_data.valid_until
    quote.delivery_address = quote_data.delivery_address
    quote.payment_terms = quote_data.payment_terms
    quote.due_date = quote_data.due_date
    quote.notes = quote_data.notes
    quote.requested_by = quote_data.requested_by
    quote.total_amount = round(sum(item.quantity * item.unit_price for item in quote_data.items), 3)

    # Recalculate/Ensure points for updated items using Sovereignty Hub
    system_config = await SystemConfig.find_one({})
    if not system_config:
        system_config = SystemConfig()

    for item in quote.items:
        if not item.loyalty_points: 
            try:
                product = await inventory_service.get_product_by_sku(item.product_sku)
                if product and product.loyalty_points > 0:
                    item.loyalty_points = product.loyalty_points
                elif system_config.loyalty.is_active and system_config.loyalty.points_per_currency_unit > 0:
                    item.loyalty_points = int(item.unit_price * system_config.loyalty.points_per_currency_unit)
                else:
                    item.loyalty_points = 0
            except Exception:
                item.loyalty_points = 0
    
    await quote.save()
    return quote

async def delete_quote(quote_number: str) -> bool:
    quote = await get_quote(quote_number)
    
    if quote.status == QuoteStatus.CONVERTED:
        linked_orders = await SalesOrder.find(
            SalesOrder.related_quote_number == quote_number,
            SalesOrder.status != OrderStatus.CONVERTED,
            SalesOrder.status != OrderStatus.CANCELLED
        ).count()
        
        if linked_orders > 0:
            raise ValidationException("No se puede eliminar una cotización que tiene órdenes activas")
        
    await quote.delete()
    return True

async def convert_quote_to_order(quote_number: str, preview: bool = False) -> Dict[str, Any]:
    quote = await get_quote(quote_number)
    
    if quote.status == QuoteStatus.CONVERTED and not preview:
        raise ValidationException("Cotización ya convertida")
        
    check_items = [
        {"product_sku": item.product_sku, "quantity": item.quantity, "unit_price": item.unit_price} 
        for item in quote.items
    ]
    
    sku_points_map = {item.product_sku: item.loyalty_points for item in quote.items}

    stock_check = await inventory_service.check_stock_availability(check_items)
    
    if preview:
        return {
            "message": "Vista previa de conversión",
            "stock_check": stock_check,
            "will_split": not stock_check["can_fulfill_full"]
        }
    
    created_orders = []
    
    if stock_check["available_items"]:
        items = [
            OrderItem(
                product_sku=i["product_sku"],
                quantity=i["quantity"],
                unit_price=i["unit_price"],
                loyalty_points=sku_points_map.get(i["product_sku"], 0)
            ) for i in stock_check["available_items"]
        ]
        
        order = SalesOrder(
            customer_name=quote.customer_name,
            customer_ruc=quote.customer_ruc,
            items=items,
            status=OrderStatus.PENDING,
            delivery_address=quote.delivery_address or "TBD",
            delivery_branch_name=quote.delivery_branch_name,
            customer_email=quote.customer_email,
            customer_username=quote.customer_username,
            related_quote_number=quote.quote_number,
            issuer_info=quote.issuer_info,
            payment_terms=quote.payment_terms,
            due_date=quote.due_date,
            amount_in_words=quote.amount_in_words,
            source=quote.source,
            date=quote.date,
            requested_by=quote.requested_by
        )
        
        saved_order = await sales_service.create_order(order)
        created_orders.append({"type": "STANDARD", "order_number": saved_order.order_number})

    if stock_check["missing_items"]:
        items = [
            OrderItem(
                product_sku=i["product_sku"],
                quantity=i["missing_quantity"],
                unit_price=i["unit_price"],
                loyalty_points=sku_points_map.get(i["product_sku"], 0)
            ) for i in stock_check["missing_items"]
        ]
        
        order = SalesOrder(
            customer_name=quote.customer_name,
            customer_ruc=quote.customer_ruc,
            items=items,
            status=OrderStatus.BACKORDER,
            delivery_address=quote.delivery_address or "TBD",
            delivery_branch_name=quote.delivery_branch_name,
            customer_email=quote.customer_email,
            customer_username=quote.customer_username,
            related_quote_number=quote.quote_number,
            issuer_info=quote.issuer_info,
            payment_terms=quote.payment_terms,
            due_date=quote.due_date,
            amount_in_words=quote.amount_in_words,
            source=quote.source,
            date=quote.date,
            requested_by=quote.requested_by
        )
        
        saved_order = await sales_service.create_order(order)
        created_orders.append({"type": "BACKORDER", "order_number": saved_order.order_number})
        
    quote.status = QuoteStatus.CONVERTED
    await quote.save()
    
    return {
        "message": "Cotización convertida exitosamente",
        "orders": created_orders,
        "stock_check": stock_check
    }
