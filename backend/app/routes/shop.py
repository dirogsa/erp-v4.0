from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
from ..models.inventory import Product, TechnicalSpec, CrossReference, Application, VehicleBrand, SearchLog, Notification
from app.models.auth import User, UserRole
from app.models.sales import SalesOrder, OrderItem, IssuerInfo, SalesQuote, OrderStatus
from app.routes.auth import get_optional_user, get_current_user
from ..schemas.common import PaginatedResponse
from app.models.company import Company
from datetime import datetime

from pydantic import BaseModel
from ..services.pricing_service import get_product_price_for_user
from ..services.risk_service import RiskService
from ..models.sales import SalesInvoice

router = APIRouter(prefix="/shop", tags=["Shop"])

@router.get("/brands", response_model=List[VehicleBrand])
async def get_shop_brands():
    """Returns all vehicle brands for the shop frontend"""
    return await VehicleBrand.find_all().to_list()

# Removed local calculate_item_price in favor of services.pricing_service.get_product_price_for_user

@router.get("/profile")
async def get_shop_profile(current_user: User = Depends(get_current_user)):
    """Returns the authenticated user's profile with stats"""
    return {
        "username": current_user.username,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "ruc_linked": current_user.ruc_linked,
        "loyalty_points": current_user.loyalty_points,
        "cumulative_sales": current_user.cumulative_sales,
        "created_at": current_user.created_at
    }

@router.get("/orders", response_model=List[SalesOrder])
async def get_shop_orders(current_user: User = Depends(get_current_user)):
    """Returns the history of orders for the current user or their company"""
    from beanie.operators import In
    
    query = {"$or": []}
    if current_user.ruc_linked:
        query["$or"].append({"customer_ruc": current_user.ruc_linked})
    
    query["$or"].append({"customer_username": current_user.username})
    
    # If a user is SUPERADMIN/ADMIN, maybe allow seeing more? 
    # But user specifically asked for "de acuerdo la sesion basnadose en el ruc"
    
    orders = await SalesOrder.find(query).to_list()
    return sorted(orders, key=lambda x: x.date, reverse=True)

@router.get("/quotes", response_model=List[SalesQuote])
async def get_shop_quotes(current_user: User = Depends(get_current_user)):
    """Returns the history of quotations for the current user or their company"""
    query = {"$or": []}
    if current_user.ruc_linked:
        query["$or"].append({"customer_ruc": current_user.ruc_linked})
    
    query["$or"].append({"customer_username": current_user.username})
    
    quotes = await SalesQuote.find(query).to_list()
    return sorted(quotes, key=lambda x: x.date, reverse=True)

@router.get("/financial-status")
async def get_financial_status(current_user: User = Depends(get_current_user)):
    """Returns the user's debt, overdue invoices, and credit limit"""
    if not current_user.ruc_linked:
        return {
            "has_account": False,
            "total_debt": 0.0,
            "overdue_count": 0,
            "credit_limit": 0.0,
            "available_credit": 0.0
        }
    
    from app.models.sales import Customer
    customer = await Customer.find_one(Customer.ruc == current_user.ruc_linked)
    
    total_debt = await RiskService.calculate_current_debt(current_user.ruc_linked)
    overdue_invoices = await RiskService.check_overdue_invoices(current_user.ruc_linked)
    
    credit_limit = customer.credit_limit if customer else 0.0
    
    return {
        "has_account": True,
        "total_debt": total_debt,
        "overdue_count": len(overdue_invoices),
        "credit_limit": credit_limit,
        "available_credit": max(0, credit_limit - total_debt),
        "ruc": current_user.ruc_linked,
        "company_name": customer.name if customer else current_user.full_name
    }

@router.get("/invoices")
async def get_shop_invoices(current_user: User = Depends(get_current_user)):
    """Returns the history of invoices for the current user's RUC"""
    if not current_user.ruc_linked:
        return []
    
    invoices = await SalesInvoice.find(SalesInvoice.customer_ruc == current_user.ruc_linked).to_list()
    # Sort by date descending
    return sorted(invoices, key=lambda x: x.date, reverse=True)

@router.get("/payment-options")
async def get_shop_payment_options(current_user: Optional[User] = Depends(get_optional_user)):
    """Returns the allowed payment terms for the current user"""
    if not current_user or not current_user.ruc_linked:
        return {"allowed_terms": [0]}
    
    from app.models.sales import Customer
    customer = await Customer.find_one(Customer.ruc == current_user.ruc_linked)
    
    if not customer:
        return {"allowed_terms": [0]}
        
    # Check for manual hard block
    if customer.credit_manual_block:
        return {
            "allowed_terms": [0],
            "reason": "Crédito bloqueado por la administración. Por favor contacte con soporte."
        }
        
    # Fetch policies to provide percentages to the shop
    from app.models.sales import SalesPolicy
    policy = await SalesPolicy.find_one()
    if not policy:
        policy = SalesPolicy()
    
    # Map surcharges to allowed terms
    surcharges = {
        0: policy.cash_discount,
        30: policy.credit_30_days,
        60: policy.credit_60_days,
        90: policy.credit_90_days,
        180: policy.credit_180_days
    }
    
    allowed_terms = customer.allowed_terms if customer.status_credit else [0]
    terms_info = [{"days": t, "surcharge": surcharges.get(t, 0.0)} for t in allowed_terms]

    return {
        "allowed_terms": allowed_terms,
        "terms_info": terms_info
    }



class ShopProductResponse(BaseModel):
    sku: str
    name: str
    brand: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    price: float
    loyalty_points: int
    points_cost: int
    stock_current: int

    category_id: Optional[str] = None
    is_new: bool = False
    discount_6_pct: float = 0.0
    discount_12_pct: float = 0.0
    discount_24_pct: float = 0.0
    type: Optional[str] = "COMMERCIAL"

class ShopProductDetailResponse(ShopProductResponse):
    specs: List[TechnicalSpec] = []
    equivalences: List[CrossReference] = []
    applications: List[Application] = []
    weight_g: float = 0.0
    features: List[str] = []


class RedemptionRequest(BaseModel):
    sku: str
    quantity: int = 1
    delivery_address: str

@router.get("/prizes", response_model=PaginatedResponse[ShopProductResponse])
async def get_redeemable_prizes(
    skip: int = 0,
    limit: int = 20
):
    """Returns products that can be redeemed with points"""
    # Filter: Points cost > 0, Active in Shop, Type MARKETING
    query = {
        "points_cost": {"$gt": 0}, 
        "is_active_in_shop": True,
        "type": "MARKETING"
    }
    
    total = await Product.find(query).count()
    prizes = await Product.find(query).skip(skip).limit(limit).to_list()
    
    items = [
        ShopProductResponse(
            sku=p.sku,
            name=p.name,
            brand=p.brand,
            description=p.description,
            image_url=p.image_url,
            price=0.0,
            loyalty_points=0,
            points_cost=p.points_cost,
            stock_current=p.stock_current,
            category_id=p.category_id,
            is_new=p.is_new,
            type=p.type
        ) for p in prizes
    ]
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=skip // limit + 1,
        pages=(total + limit - 1) // limit,
        size=limit
    )

@router.post("/redeem")
async def redeem_prize(
    req: RedemptionRequest,
    current_user: User = Depends(get_current_user)
):
    product = await Product.find_one(Product.sku == req.sku)
    if not product or product.points_cost <= 0:
        raise HTTPException(status_code=404, detail="Prize not found or not redeemable")
    
    if product.stock_current < req.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    total_points_needed = product.points_cost * req.quantity
    if (current_user.loyalty_points or 0) < total_points_needed:
        raise HTTPException(status_code=400, detail="Insufficient loyalty points")
    
    # Create a direct SalesOrder for the redemption
    order_item = OrderItem(
        product_sku=product.sku,
        product_name=product.name,
        quantity=req.quantity,
        unit_price=0.0
    )
    
    # Snapshot company info
    # Get the designated active web company
    company = await Company.find_one(Company.is_active_web == True)
    if not company:
        # Fallback to the first company found if no web company is explicitly marked
        company = await Company.find_one({})
    issuer_info = None
    if company:
        issuer_info = IssuerInfo(
            name=company.name,
            ruc=company.ruc,
            address=company.address or "",
            phone=company.phone,
            email=company.email,
            website=company.website,
            logo_url=company.logo_url,
            bank_name=company.bank_name,
            account_soles=company.account_soles,
            account_dollars=company.account_dollars
        )

    redeem_order = SalesOrder(
        customer_name=current_user.full_name,
        customer_email=current_user.email,
        customer_username=current_user.username,
        customer_ruc=current_user.ruc_linked or "CANJE",
        items=[order_item],
        status=OrderStatus.PENDING,
        delivery_address=req.delivery_address,
        issuer_info=issuer_info,
        source="SHOP_REDEMPTION",
        notes=f"CANJE DE PREMIO: {total_points_needed} puntos"
    )
    
    # We bypass the normal create_order to avoid re-adding points
    # Wait, create_order handles sequences. Let's use it but ensure points granted is 0.
    from app.services import sales_service
    saved_order = await sales_service.create_order(redeem_order)

    
    # Fix the points granted and deduct from user
    saved_order.loyalty_points_granted = 0
    await saved_order.save()
    
    current_user.loyalty_points -= total_points_needed
    await current_user.save()
    
    return {
        "message": "Redemption successful",
        "order_number": saved_order.order_number,
        "points_deducted": total_points_needed,
        "remaining_points": current_user.loyalty_points
    }

class CheckoutItem(BaseModel):
    sku: str
    quantity: int

class CheckoutRequest(BaseModel):
    items: List[CheckoutItem]
    customer_name: str
    customer_ruc: str
    delivery_address: str
    delivery_branch_name: Optional[str] = None
    payment_term: int = 0 # 0=Cash, 30, 60, etc.
    notes: Optional[str] = None

@router.get("/products", response_model=PaginatedResponse[ShopProductResponse])
async def get_shop_products(
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    category: Optional[str] = None,
    mode: Optional[str] = "all",
    vehicle_brand: Optional[str] = None,
    is_new: Optional[bool] = None,
    current_user: Optional[User] = Depends(get_optional_user)
):
    print(f"[SHOP] GET /products called - search: {search}, category: {category}, is_new: {is_new}")
    
    query = {"is_active_in_shop": True, "type": "COMMERCIAL"}
    if is_new is not None:
        query["is_new"] = is_new
    if search:
        if mode == "vehicle":
            query["$or"] = [
                {"applications.make": {"$regex": search, "$options": "i"}},
                {"applications.model": {"$regex": search, "$options": "i"}}
            ]
        elif mode == "specs":
            query["specs.value"] = {"$regex": search, "$options": "i"}
        elif mode == "equivalence":
            query["equivalences.code"] = {"$regex": search, "$options": "i"}
        else: # "all" or others
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"sku": {"$regex": search, "$options": "i"}},
                {"brand": {"$regex": search, "$options": "i"}},
                {"equivalences.code": {"$regex": search, "$options": "i"}},
                {"applications.make": {"$regex": search, "$options": "i"}},
                {"applications.model": {"$regex": search, "$options": "i"}},
                {"specs.value": {"$regex": search, "$options": "i"}},
                {"specs.name": {"$regex": search, "$options": "i"}}
            ]
    if category:
        query["category_id"] = category
    if vehicle_brand:
        query["applications.make"] = {"$regex": f"^{vehicle_brand}$", "$options": "i"}

    print(f"[SHOP] Query: {query}")
    
    total = await Product.find(query).count()
    products = await Product.find(query).skip(skip).limit(limit).to_list()
    
    print(f"[SHOP] Found {total} products, returning {len(products)} items")

    # Resolve pricing based on user role
    role = current_user.role if current_user else UserRole.CUSTOMER_B2C
    print(f"[SHOP] User role: {role}")
    
    response_items = []
    for p in products:
        # For list, we show base price (quantity=1)
        price = await get_product_price_for_user(p, 1, current_user)
        
        response_items.append(ShopProductResponse(
            sku=p.sku,
            name=p.name,
            brand=p.brand,
            description=p.description,
            image_url=p.image_url,
            price=price,
            loyalty_points=p.loyalty_points,
            points_cost=p.points_cost,
            stock_current=p.stock_current,

            category_id=p.category_id,
            is_new=p.is_new,
            discount_6_pct=p.discount_6_pct,
            discount_12_pct=p.discount_12_pct,
            discount_24_pct=p.discount_24_pct
        ))

    print(f"[SHOP] Returning {len(response_items)} items to frontend")
    
    # Record search analytics (Async/Background-like)
    if search:
        try:
            log = SearchLog(
                query=search,
                mode=mode or "all",
                results_count=total,
                user_id=str(current_user.id) if current_user else None
            )
            await log.insert()
        except:
            pass # Analytics should never break the request
    
    return PaginatedResponse(
        items=response_items,
        total=total,
        page=skip // limit + 1,
        pages=(total + limit - 1) // limit,
        size=limit
    )

@router.get("/products/{sku}", response_model=ShopProductDetailResponse)
async def get_shop_product_detail(
    sku: str,
    current_user: Optional[User] = Depends(get_optional_user)
):
    p = await Product.find_one(Product.sku == sku, Product.is_active_in_shop == True)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found or not available in shop")

    price = await get_product_price_for_user(p, 1, current_user)

    return ShopProductDetailResponse(
        sku=p.sku,
        name=p.name,
        brand=p.brand,
        description=p.description,
        image_url=p.image_url,
        price=price,
        loyalty_points=p.loyalty_points,
        points_cost=p.points_cost,
        stock_current=p.stock_current,

        category_id=p.category_id,
        is_new=p.is_new,
        specs=p.specs,
        equivalences=p.equivalences,
        applications=p.applications,
        weight_g=p.weight_g,
        features=p.features,
        discount_6_pct=p.discount_6_pct,
        discount_12_pct=p.discount_12_pct,
        discount_24_pct=p.discount_24_pct
    )

@router.post("/checkout")
async def checkout(
    req: CheckoutRequest,
    current_user: Optional[User] = Depends(get_optional_user)
):
    if not req.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Validate Credit and Apply Surcharges if needed
    order_items = []
    
    # Validate Credit and Apply Surcharges if needed
    from app.services.pricing_calculator import PricingCalculator
    from app.services.risk_service import RiskService
    
    # Calculate initial total for limit validation
    initial_total = 0
    
    for item in req.items:
        product = await Product.find_one(Product.sku == item.sku)
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.sku} not found")
        
        base_price = await get_product_price_for_user(product, item.quantity, current_user)
        # Apply surcharge
        final_price = await PricingCalculator.get_adjusted_price(base_price, req.payment_term)
        
        order_items.append(OrderItem(
            product_sku=item.sku,
            product_name=product.name,
            quantity=item.quantity,
            unit_price=final_price
        ))
        initial_total += final_price * item.quantity

    # If it's a credit purchase, perform risk validation
    if req.payment_term > 0:
        if not current_user or not current_user.ruc_linked:
            raise HTTPException(status_code=403, detail="Debe tener una cuenta vinculada a un RUC para solicitar crédito.")
        
        authorized, reason = await RiskService.validate_credit_request(current_user.ruc_linked, initial_total)
        if not authorized:
            raise HTTPException(status_code=403, detail=reason)


    # Get Company Snapshot
    # Get the designated active web company
    company = await Company.find_one(Company.is_active_web == True)
    if not company:
        # Fallback to the first company found if no web company is explicitly marked
        company = await Company.find_one({}) # Get first company or default
    issuer_info = None
    if company:
        issuer_info = IssuerInfo(
            name=company.name,
            ruc=company.ruc,
            address=company.address or "",
            phone=company.phone,
            email=company.email,
            website=company.website,
            logo_url=company.logo_url,
            bank_name=company.bank_name,
            account_soles=company.account_soles,
            account_dollars=company.account_dollars
        )

    # Create SalesQuote (Architecture change: Quotation first, then fulfillment)
    new_quote = SalesQuote(
        customer_name=req.customer_name,
        customer_email=current_user.email if current_user else None,
        customer_username=current_user.username if current_user else None,
        customer_ruc=req.customer_ruc,
        items=order_items,
        delivery_address=req.delivery_address,
        delivery_branch_name=req.delivery_branch_name,
        issuer_info=issuer_info,
        date=datetime.now(),
        source="SHOP",
        notes=req.notes
    )

    from app.services import sales_quotes_service
    created_quote = await sales_quotes_service.create_quote(new_quote)


    
    return {
        "message": "Quotation submitted successfully. Review it in the ERP to finalize your order.",
        "quote_number": created_quote.quote_number,
        "total_amount": created_quote.total_amount
    }

@router.get("/predictive-order", response_model=List[ShopProductResponse])
async def get_predictive_order(current_user: User = Depends(get_current_user)):
    """Analiza compras pasadas y sugiere un pedido de reabastecimiento"""
    if not current_user.ruc_linked:
        return []
    
    # 1. Buscar facturas pasadas
    from app.models.sales import SalesInvoice
    invoices = await SalesInvoice.find(SalesInvoice.customer_ruc == current_user.ruc_linked).to_list()
    
    if not invoices:
        return []
        
    # 2. Contar frecuencia de SKUs
    sku_freq = {}
    for inv in invoices:
        for item in inv.items:
            sku_freq[item.product_sku] = sku_freq.get(item.product_sku, 0) + item.quantity

    # 3. Obtener los 10 más comprados
    top_skus = sorted(sku_freq.items(), key=lambda x: x[1], reverse=True)[:10]
    sku_list = [s[0] for s in top_skus]
    
    # 4. Obtener datos actuales de esos productos
    products = await Product.find({"sku": {"$in": sku_list}, "is_active_in_shop": True}).to_list()
    
    # Resolve pricing
    role = current_user.role
    response_items = []
    for p in products:
        price = p.price_wholesale if role == UserRole.CUSTOMER_B2B else p.price_retail
        response_items.append(ShopProductResponse(
            **p.model_dump(exclude={"id"}),
            price=price
        ))
        
    return response_items

@router.get("/notifications", response_model=List[Notification])
async def get_notifications(current_user: User = Depends(get_current_user)):
    """Obtiene las notificaciones del usuario actual"""
    user_id_str = str(current_user.id)
    notifications = await Notification.find(Notification.user_id == user_id_str).sort("-created_at").limit(20).to_list()
    return notifications

@router.post("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str, current_user: User = Depends(get_current_user)):
    """Marca una notificación como leída"""
    notif = await Notification.get(notif_id)
    if notif and notif.user_id == str(current_user.id):
        notif.is_read = True
        await notif.save()
    return {"status": "ok"}
