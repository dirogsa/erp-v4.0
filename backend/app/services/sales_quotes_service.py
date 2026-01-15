from typing import List, Optional, Dict, Any
from datetime import datetime
from beanie import PydanticObjectId
from app.models.sales import SalesQuote, QuoteStatus, SalesOrder, OrderStatus, OrderItem
from app.services import sales_service, inventory_service
from app.models.inventory import Product
from app.models.marketing import LoyaltyConfig
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
            {"customer_name": {"$regex": search, "$options": "i"}}
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

    # Snapshot loyalty points
    loyalty_config = await LoyaltyConfig.find_one({})
    if not loyalty_config:
        loyalty_config = LoyaltyConfig()

    for item in quote.items:
        # Check if points are already set (e.g. from frontend)? usually strictly backend.
        # We re-fetch product to be sure of current value at creation time.
        try:
            product = await inventory_service.get_product_by_sku(item.product_sku)
            if product.loyalty_points > 0:
                item.loyalty_points = product.loyalty_points
            elif loyalty_config.is_active and loyalty_config.points_per_sole > 0:
                item.loyalty_points = int(item.unit_price * loyalty_config.points_per_sole)
            else:
                item.loyalty_points = 0
        except Exception:
             item.loyalty_points = 0
    
    await quote.insert()
    return quote

async def update_quote(quote_number: str, quote_data: SalesQuote) -> SalesQuote:
    quote = await get_quote(quote_number)
    
    if quote.status in [QuoteStatus.ACCEPTED, QuoteStatus.CONVERTED, QuoteStatus.REJECTED]:
        raise ValidationException("Cannot update a finalized quote")
    
    quote.customer_name = quote_data.customer_name
    quote.customer_ruc = quote_data.customer_ruc
    quote.items = quote_data.items
    quote.date = quote_data.date # Permitir actualizar la fecha de emisión
    quote.valid_until = quote_data.valid_until
    quote.delivery_address = quote_data.delivery_address
    quote.notes = quote_data.notes
    quote.total_amount = round(sum(item.quantity * item.unit_price for item in quote_data.items), 3)

    # Recalculate/Ensure points for updated items
    loyalty_config = await LoyaltyConfig.find_one({})
    if not loyalty_config:
        loyalty_config = LoyaltyConfig()

    for item in quote.items:
        # If points are missing (new item) or we want to refresh draft:
        # For simplicity and consistency in Drafts, we might refresh all, or only 0s.
        # Let's refresh if 0/None to ensure data integrity.
        if not item.loyalty_points: 
            try:
                product = await inventory_service.get_product_by_sku(item.product_sku)
                if product.loyalty_points > 0:
                    item.loyalty_points = product.loyalty_points
                elif loyalty_config.is_active and loyalty_config.points_per_sole > 0:
                    item.loyalty_points = int(item.unit_price * loyalty_config.points_per_sole)
                else:
                    item.loyalty_points = 0
            except Exception:
                item.loyalty_points = 0
    
    await quote.save()
    return quote

async def delete_quote(quote_number: str) -> bool:
    quote = await get_quote(quote_number)
    
    if quote.status == QuoteStatus.CONVERTED:
        # Check if linked ACTIVE orders exist (Exclude CONVERTED or CANCELLED)
        linked_orders = await SalesOrder.find(
            SalesOrder.related_quote_number == quote_number,
            SalesOrder.status != OrderStatus.CONVERTED,
            SalesOrder.status != OrderStatus.CANCELLED
        ).count()
        
        if linked_orders > 0:
            raise ValidationException("Cannot delete a converted quote that has active orders")
        
    await quote.delete()
    return True

async def convert_quote_to_order(quote_number: str, preview: bool = False) -> Dict[str, Any]:
    quote = await get_quote(quote_number)
    
    if quote.status == QuoteStatus.CONVERTED and not preview:
        raise ValidationException("Quote already converted")
        
    # Prepare items for check
    print(f"DEBUG QUOTE ITEMS: {quote.items}")
    check_items = [
        {"product_sku": item.product_sku, "quantity": item.quantity, "unit_price": item.unit_price} 
        for item in quote.items
    ]
    
    # Map sku -> points from quote items to preserve snapshot
    sku_points_map = {item.product_sku: item.loyalty_points for item in quote.items}

    stock_check = await inventory_service.check_stock_availability(check_items)
    
    if preview:
        return {
            "message": "Conversion preview",
            "stock_check": stock_check,
            "will_split": not stock_check["can_fulfill_full"]
        }
    
    created_orders = []
    
    # Create Standard Order if available items exist
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
            related_quote_number=quote.quote_number,
            issuer_info=quote.issuer_info,
            source=quote.source
        )

        
        saved_order = await sales_service.create_order(order)
        created_orders.append({"type": "STANDARD", "order_number": saved_order.order_number})

    # Create Backorder if missing items exist
    if stock_check["missing_items"]:
        items = [
            OrderItem(
                product_sku=i["product_sku"],
                quantity=i["missing_quantity"], # Create order for the MISSING amount
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
            related_quote_number=quote.quote_number,
            issuer_info=quote.issuer_info,
            source=quote.source
        )

        
        saved_order = await sales_service.create_order(order)
        created_orders.append({"type": "BACKORDER", "order_number": saved_order.order_number})
        
    # Update Quote
    quote.status = QuoteStatus.CONVERTED
    await quote.save()
    
    return {
        "message": "Quote converted successfully",
        "orders": created_orders,
        "stock_check": stock_check
    }
