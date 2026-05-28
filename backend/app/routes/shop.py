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
from ..services.pricing_service import PricingService
from ..services.risk_service import RiskService
from ..models.sales import SalesInvoice

router = APIRouter(prefix="/shop", tags=["Shop"])

@router.get("/brands", response_model=List[VehicleBrand])
async def get_shop_brands():
    """Returns static vehicle brands from the specialized collection (highly optimized)"""
    return await VehicleBrand.find({"is_active": True}).sort([("name", 1)]).to_list()

@router.get("/vehicles")
async def get_synchronized_vehicles():
    """Returns a list of all makes and models available in the ACTIVE master product list"""
    # Filter products that are active in shop to ensure relevance
    pipeline = [
        {"$match": {
            "is_active_in_shop": True, 
            "applications": {"$exists": True, "$not": {"$size": 0}}
        }},
        {"$unwind": "$applications"},
        {"$group": {
            "_id": {"$toUpper": "$applications.make"}, # Normalizamos a Mayúsculas
            "models": {"$addToSet": {"$toUpper": "$applications.model"}}
        }},
        {"$sort": {"_id": 1}}
    ]
    
    results = await Product.get_motor_collection().aggregate(pipeline).to_list(length=None)
    
    # Format: [{"make": "TOYOTA", "models": ["YARIS", "HILUX", ...]}, ...]
    return [
        {"make": r["_id"], "models": sorted(r["models"])} 
        for r in results if r["_id"]
    ]

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
    from app.models.config import SystemConfig
    config = await SystemConfig.find_one({})
    if not config:
        config = SystemConfig()
    
    policy = config.sales_policy
    
    # Map surcharges to allowed terms
    surcharges = {
        0: policy.cash_discount_pct,
        30: policy.credit_30_days_pct,
        60: policy.credit_60_days_pct,
        90: policy.credit_90_days_pct,
        180: policy.credit_180_days_pct
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
    discount_3_pct: float = 0.0
    discount_6_pct: float = 0.0
    discount_12_pct: float = 0.0
    promo_discount_pct: float = 0.0
    type: Optional[str] = "COMMERCIAL"
    matched_equivalence: Optional[str] = None

class ProductReviewResponse(BaseModel):
    user_name: str
    rating: int
    comment: Optional[str] = None
    is_verified_buyer: bool
    created_at: datetime

class ShopProductDetailResponse(ShopProductResponse):
    specs: List[TechnicalSpec] = []
    equivalences: List[CrossReference] = []
    applications: List[Application] = []
    weight_g: float = 0.0
    features: List[str] = []
    faqs: List[Dict[str, str]] = []
    maintenance_tips: List[str] = []
    reviews: List[ProductReviewResponse] = []


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
    vehicle_model: Optional[str] = None,
    spec_h: Optional[str] = None, # Altura
    spec_d: Optional[str] = None, # Diámetro
    spec_t: Optional[str] = None, # Rosca
    spec_id: Optional[str] = None, # Diámetro Interior
    is_new: Optional[bool] = None,
    current_user: Optional[User] = Depends(get_optional_user)
):
    print(f"[SHOP] GET /products called - search: '{search}', make: {vehicle_brand}, model: {vehicle_model}")
    
    # Base query for commercial products, now highly tolerant of CSV import variations
    # Consulta profesional: Booleano estricto
    query = {"is_active_in_shop": True}
    
    if search:
        s = search.strip()
        if mode == "vehicle":
            query["$or"] = [
                {"applications.make": {"$regex": s, "$options": "i"}},
                {"applications.model": {"$regex": s, "$options": "i"}}
            ]
        elif mode == "specs":
            query["specs.value"] = {"$regex": s, "$options": "i"}
        elif mode == "equivalence":
            query["equivalences.code"] = {"$regex": s, "$options": "i"}
        else:
            # Smart Search: Try direct SKU match first, then regex broad search
            query["$or"] = [
                {"sku": s}, # Match exacto (prioridad)
                {"sku": {"$regex": s, "$options": "i"}},
                {"name": {"$regex": s, "$options": "i"}},
                {"brand": {"$regex": s, "$options": "i"}},
                {"equivalences.code": {"$regex": s, "$options": "i"}},
                {"applications.make": {"$regex": s, "$options": "i"}},
                {"applications.model": {"$regex": s, "$options": "i"}},
                {"specs.value": {"$regex": s, "$options": "i"}}
            ]
    
    if category:
        query["category_id"] = category

    if is_new:
        query["is_new"] = True
        
    # Precise Vehicle Filtering
    if vehicle_brand and vehicle_model:
        query["applications"] = {
            "$elemMatch": {
                "make": {"$regex": f"^{vehicle_brand}$", "$options": "i"},
                "model": {"$regex": f"^{vehicle_model}$", "$options": "i"}
            }
        }
    elif vehicle_brand:
        query["applications.make"] = {"$regex": f"^{vehicle_brand}$", "$options": "i"}
    elif vehicle_model:
        query["applications.model"] = {"$regex": f"^{vehicle_model}$", "$options": "i"}

    # Dimension (Specs) Filtering - World-Class precision (Numeric Tolerance Support)
    spec_filters = []
    
    def add_spec_filter(val, regex_labels):
        if not val: return
        try:
            num_val = float(val.replace(',', '.'))
            # Plan Maestro: Tolerancia de +/- 0.5mm
            spec_filters.append({
                "$elemMatch": {
                    "label": {"$regex": regex_labels, "$options": "i"},
                    "$or": [
                        {"value_num": {"$gte": num_val - 0.5, "$lte": num_val + 0.5}},
                        {"value": {"$regex": val}} # Fallback a texto
                    ]
                }
            })
        except ValueError:
            # Si no es número (ej: una rosca "3/4-16"), búsqueda por texto
            spec_filters.append({
                "$elemMatch": {
                    "label": {"$regex": regex_labels, "$options": "i"},
                    "value": {"$regex": val, "$options": "i"}
                }
            })

    add_spec_filter(spec_h, "^H$|^Altura$|^Height$|^Alto$")
    add_spec_filter(spec_d, "^A$|^D$|^Diámetro Exterior$|^Outer Diameter$|^Diámetro$|^Diám. Ext.$")
    add_spec_filter(spec_t, "^G$|^T$|^Rosca$|^Thread$|^Paso de Rosca$")
    add_spec_filter(spec_id, "^B$|^C$|^Diámetro Interior$|^Inner Diameter$")
    
    if spec_filters:
        query["specs"] = {"$all": spec_filters}

    # We only apply strict COMMERCIAL type if not doing a direct SKU search to be more flexible
    if not (search and len(search) > 4):
        query["type"] = {"$in": ["COMMERCIAL", "", None]}

    print(f"[SHOP] Final MongoDB Query: {query}")

    print(f"[SHOP] Query: {query}")
    
    total = await Product.find(query).count()
    products = await Product.find(query).skip(skip).limit(limit).to_list()
    
    print(f"[SHOP] Found {total} products, returning {len(products)} items")

    # Resolve pricing based on user role
    role = current_user.role if current_user else UserRole.CUSTOMER_B2C
    print(f"[SHOP] User role: {role}")
    
    # Obtener políticas globales para fallback
    from app.models.config import SystemConfig
    _config = await SystemConfig.find_one({})
    policy = _config.sales_policy if _config else None
    # Get the designated active web company for currency context
    shop_company = await Company.find_one(Company.is_active_web == True)
    if not shop_company:
        shop_company = await Company.find_one({})
    shop_company_ruc = shop_company.ruc if shop_company else None

    response_items = []
    for p in products:
        # For list, we show base price (quantity=1) using the new Dynamic Engine
        price_info = await PricingService.get_product_price(p.sku, brand=p.brand, quantity=1)
        price = price_info.get("price", 0.0)
        
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
            discount_3_pct=policy.vol_3_discount_pct if policy else 0.0,
            discount_6_pct=policy.vol_6_discount_pct if policy else 0.0,
            discount_12_pct=policy.vol_12_discount_pct if policy else 0.0,
            promo_discount_pct=p.promo_discount_pct,
            matched_equivalence=next((eq.code for eq in p.equivalences if search and search.strip().upper() in eq.code.upper()), None) if search else None
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
    import re
    # Hacemos que la búsqueda del SKU sea insensible a mayúsculas y minúsculas (case-insensitive)
    p = await Product.find_one({
        "sku": {"$regex": f"^{re.escape(sku)}$", "$options": "i"},
        "is_active_in_shop": True,
    })
    if not p:
        raise HTTPException(status_code=404, detail="Product not found or not available in shop")
    price_info = await PricingService.get_product_price(p.sku, brand=p.brand, quantity=1)
    price = price_info.get("price", 0.0)
    
    from app.models.config import SystemConfig
    _config = await SystemConfig.find_one({})
    policy = _config.sales_policy if _config else None

    # Fetch reviews
    from app.models.inventory import ProductReview
    reviews_db = await ProductReview.find({"product_sku": p.sku, "is_approved": True}).sort("-created_at").to_list()
    reviews = [
        ProductReviewResponse(
            user_name=r.user_name,
            rating=r.rating,
            comment=r.comment,
            is_verified_buyer=r.is_verified_buyer,
            created_at=r.created_at
        ) for r in reviews_db
    ]

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
        discount_3_pct=policy.vol_3_discount_pct if policy else 0.0,
        discount_6_pct=policy.vol_6_discount_pct if policy else 0.0,
        discount_12_pct=policy.vol_12_discount_pct if policy else 0.0,
        promo_discount_pct=p.promo_discount_pct,
        faqs=p.faqs,
        maintenance_tips=p.maintenance_tips,
        reviews=reviews
    )

class ReviewCreateRequest(BaseModel):
    user_name: str
    email: str # Se guarda por seguridad pero no se expone
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None

@router.post("/products/{sku}/reviews")
async def create_product_review(
    sku: str,
    req: ReviewCreateRequest,
    current_user: Optional[User] = Depends(get_optional_user)
):
    from app.models.inventory import ProductReview
    
    product = await Product.find_one({"sku": sku})
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # Si está autenticado y tiene ruc_linked, podríamos marcarlo como verificado
    is_verified = False
    if current_user and current_user.ruc_linked:
        is_verified = True
        
    review = ProductReview(
        product_sku=sku,
        user_id=str(current_user.id) if current_user else "GUEST",
        user_name=req.user_name,
        rating=req.rating,
        comment=req.comment,
        is_verified_buyer=is_verified,
        is_approved=is_verified # Si es cliente verificado, auto-aprobar. Si no, a moderación.
    )
    await review.insert()
    
    return {"message": "Reseña recibida con éxito. Será publicada tras su moderación." if not is_verified else "Reseña publicada con éxito."}

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
        
        # Get the designated active web company for currency context
        shop_company = await Company.find_one(Company.is_active_web == True)
        if not shop_company:
            shop_company = await Company.find_one({})
        shop_company_ruc = shop_company.ruc if shop_company else None

        price_info = await PricingService.get_product_price(product.sku, item.quantity)
        base_price = price_info.get("price", 0.0)
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

    # ENTERPRISE AUTO-CONVERSION: Immediately split into Order and Backorder
    # This provides real-time transparency to the customer about stock availability.
    conversion_result = await sales_quotes_service.convert_quote_to_order(created_quote.quote_number)
    
    return {
        "message": conversion_result.get("message", "Pedido procesado exitosamente."),
        "quote_number": created_quote.quote_number,
        "orders": conversion_result.get("orders", []),
        "stock_check": conversion_result.get("stock_check", {}),
        "total_amount": created_quote.total_amount
    }

@router.get("/admin/stats")
async def get_admin_dashboard_stats(
    company_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Returns global or company-specific KPIs for the Admin Dashboard.
    """
    if current_user.role not in [UserRole.SUPERADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Acceso denegado.")
        
    query = {}
    if current_user.role == UserRole.ADMIN:
        # Strict enforcement: Admin only sees their company
        query["company_id"] = current_user.current_company_id
    elif current_user.role == UserRole.SUPERADMIN and company_id:
        # SuperAdmin can filter by company or see all
        query["company_id"] = company_id
        
    # Parallel counts for performance
    total_orders = await SalesOrder.find(query).count()
    backorders_count = await SalesOrder.find({**query, "status": OrderStatus.BACKORDER}).count()
    pending_count = await SalesOrder.find({**query, "status": OrderStatus.PENDING}).count()
    
    # Financial aggregate
    pipeline = [
        {"$match": {**query, "status": {"$ne": OrderStatus.CANCELLED}}},
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
    ]
    revenue_res = await SalesOrder.get_motor_collection().aggregate(pipeline).to_list(1)
    total_revenue = revenue_res[0]["total"] if revenue_res else 0.0
    
    return {
        "total_orders": total_orders,
        "backorders_count": backorders_count,
        "pending_count": pending_count,
        "total_revenue": round(total_revenue, 2)
    }

@router.get("/admin/orders")
async def get_admin_orders_dashboard(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[OrderStatus] = None,
    company_id: Optional[str] = None,
    customer_ruc: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user)
):
    """
    MASTER DASHBOARD for Admin/SuperAdmin.
    - SUPERADMIN: Full visibility, can filter by any company.
    - ADMIN: Forced visibility to their own current_company_id.
    """
    if current_user.role not in [UserRole.SUPERADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Acceso denegado. Se requiere rol administrativo.")

    query = {}
    
    # 1. Multi-tenancy enforcement (The 'Senior Architect' Firewall)
    if current_user.role == UserRole.ADMIN:
        query["company_id"] = current_user.current_company_id
    elif current_user.role == UserRole.SUPERADMIN and company_id:
        query["company_id"] = company_id
            
    # 2. Dynamic Filters
    if status:
        query["status"] = status
    if customer_ruc:
        query["customer_ruc"] = customer_ruc
    if start_date or end_date:
        query["date"] = {}
        if start_date:
            query["date"]["$gte"] = start_date
        if end_date:
            query["date"]["$lte"] = end_date

    # 3. Scalable Execution (Pagination & Projections)
    skip = (page - 1) * page_size
    total = await SalesOrder.find(query).count()
    orders = await SalesOrder.find(query).sort("-date").skip(skip).limit(page_size).to_list()
    
    return {
        "items": orders,
        "total": total,
        "page": page,
        "pages": (total + page_size - 1) // page_size,
        "size": len(orders)
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
    
    # Obtener políticas globales para fallback
    from app.models.config import SystemConfig
    _config = await SystemConfig.find_one({})
    policy = _config.sales_policy if _config else None
    
    # Resolve pricing
    role = current_user.role
    response_items = []
    for p in products:
        price = p.price_list
        response_items.append(ShopProductResponse(
            **p.model_dump(exclude={"id", "discount_3_pct", "discount_6_pct", "discount_12_pct"}),
            price=price,
            discount_3_pct=p.discount_3_pct if p.discount_3_pct > 0 else (policy.vol_3_discount_pct if policy else 0),
            discount_6_pct=p.discount_6_pct if p.discount_6_pct > 0 else (policy.vol_6_discount_pct if policy else 0),
            discount_12_pct=p.discount_12_pct if p.discount_12_pct > 0 else (policy.vol_12_discount_pct if policy else 0)
        ))
        
    return response_items

@router.delete("/orders/{order_number}")
async def cancel_shop_order(order_number: str, current_user: User = Depends(get_current_user)):
    """Allows a customer to cancel their own order (useful for releasing backorders)"""
    from app.services import sales_service
    
    order = await SalesOrder.find_one(SalesOrder.order_number == order_number)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    # Security: Ensure the order belongs to the user
    belongs_to_user = (order.customer_username == current_user.username) or \
                      (order.customer_ruc == current_user.ruc_linked and current_user.ruc_linked is not None)
                      
    if not belongs_to_user:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this order")
        
    # Logic: Only allow cancellation if not invoiced or dispatched
    if order.status in [OrderStatus.INVOICED, OrderStatus.PARTIALLY_INVOICED]:
        raise HTTPException(status_code=400, detail="No se puede cancelar una orden que ya tiene facturas generadas.")
        
    await sales_service.delete_order(order_number, user=current_user)
    return {"status": "ok", "message": f"Orden {order_number} cancelada exitosamente."}

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
