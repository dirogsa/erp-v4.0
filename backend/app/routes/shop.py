from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
from ..models.inventory import Product, TechnicalSpec, CrossReference, Application, VehicleBrand, SearchLog
from app.models.auth import User, UserRole
from app.models.sales import SalesOrder, OrderItem, IssuerInfo
from app.routes.auth import get_optional_user, get_current_user
from ..schemas.common import PaginatedResponse
from app.models.company import Company
from app.services import sales_service
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(prefix="/shop", tags=["Shop"])

@router.get("/brands", response_model=List[VehicleBrand])
async def get_shop_brands():
    """Returns all vehicle brands for the shop frontend"""
    return await VehicleBrand.find_all().to_list()

def calculate_item_price(product: Product, quantity: int, role: UserRole, user_discount: float = 0.0) -> float:
    """Calcula el precio final aplicando descuentos por volumen y descuento de usuario"""
    # 1. Precio base por rol
    base_price = product.price_wholesale if role == UserRole.CUSTOMER_B2B else product.price_retail
    
    # 2. Descuento por volumen (máximo aplicable)
    vol_discount_pct = 0.0
    if quantity >= 24:
        vol_discount_pct = product.discount_24_pct
    elif quantity >= 12:
        vol_discount_pct = product.discount_12_pct
    elif quantity >= 6:
        vol_discount_pct = product.discount_6_pct
    
    # 3. Aplicar descuentos de forma multiplicativa
    # Price = Base * (1 - VolDisc) * (1 - UserDisc)
    price_after_vol = base_price * (1 - (vol_discount_pct / 100))
    final_price = price_after_vol * (1 - (user_discount / 100))
    
    return round(final_price, 3)

@router.get("/profile")
async def get_shop_profile(current_user: User = Depends(get_current_user)):
    """Returns the authenticated user's profile with stats"""
    return {
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "loyalty_points": current_user.loyalty_points,
        "cumulative_sales": current_user.cumulative_sales,
        "created_at": current_user.created_at
    }

@router.get("/orders", response_model=List[SalesOrder])
async def get_shop_orders(current_user: User = Depends(get_current_user)):
    """Returns the history of orders for the current user"""
    # Find orders by customer email
    orders = await SalesOrder.find(SalesOrder.customer_email == current_user.email).to_list()
    return sorted(orders, key=lambda x: x.date, reverse=True)

class ShopProductResponse(BaseModel):
    sku: str
    name: str
    brand: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    price: float
    loyalty_points: int
    stock_current: int
    category_id: Optional[str] = None
    is_new: bool = False
    discount_6_pct: float = 0.0
    discount_12_pct: float = 0.0
    discount_24_pct: float = 0.0

class ShopProductDetailResponse(ShopProductResponse):
    specs: List[TechnicalSpec] = []
    equivalences: List[CrossReference] = []
    applications: List[Application] = []
    weight_g: float = 0.0
    features: List[str] = []

class CheckoutItem(BaseModel):
    sku: str
    quantity: int

class CheckoutRequest(BaseModel):
    items: List[CheckoutItem]
    customer_name: str
    customer_ruc: str
    delivery_address: str
    delivery_branch_name: Optional[str] = None
    notes: Optional[str] = None

@router.get("/products", response_model=PaginatedResponse[ShopProductResponse])
async def get_shop_products(
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    category: Optional[str] = None,
    mode: Optional[str] = "all",
    vehicle_brand: Optional[str] = None,
    current_user: Optional[User] = Depends(get_optional_user)
):
    print(f"[SHOP] GET /products called - search: {search}, category: {category}")
    
    query = {"is_active_in_shop": True}
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
                {"specs.value": {"$regex": search, "$options": "i"}}
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
        price = calculate_item_price(p, 1, role, current_user.custom_discount_percent if current_user else 0.0)
        
        response_items.append(ShopProductResponse(
            sku=p.sku,
            name=p.name,
            brand=p.brand,
            description=p.description,
            image_url=p.image_url,
            price=price,
            loyalty_points=p.loyalty_points,
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

    role = current_user.role if current_user else UserRole.CUSTOMER_B2C
    price = calculate_item_price(p, 1, role, current_user.custom_discount_percent if current_user else 0.0)

    return ShopProductDetailResponse(
        sku=p.sku,
        name=p.name,
        brand=p.brand,
        description=p.description,
        image_url=p.image_url,
        price=price,
        loyalty_points=p.loyalty_points,
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

    # Resolve pricing and validate items
    role = current_user.role if current_user else UserRole.CUSTOMER_B2C
    order_items = []
    
    for item in req.items:
        product = await Product.find_one(Product.sku == item.sku)
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.sku} not found")
        
        price = calculate_item_price(
            product, 
            item.quantity, 
            role, 
            current_user.custom_discount_percent if current_user else 0.0
        )
        
        order_items.append(OrderItem(
            product_sku=item.sku,
            quantity=item.quantity,
            unit_price=price
        ))

    # Get Company Snapshot
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

    # Create SalesOrder
    new_order = SalesOrder(
        customer_name=req.customer_name,
        customer_email=current_user.email if current_user else None,
        customer_ruc=req.customer_ruc,
        items=order_items,
        delivery_address=req.delivery_address,
        delivery_branch_name=req.delivery_branch_name,
        issuer_info=issuer_info,
        date=datetime.now(),
        source="SHOP"
    )

    created_order = await sales_service.create_order(new_order)

    # Accumulate loyalty points and sales if user is logged in
    if current_user:
        # Calculate points from current inventory data to be accurate
        points_earned = 0
        for item in req.items:
            product = await Product.find_one(Product.sku == item.sku)
            if product:
                points_earned += product.loyalty_points * item.quantity
        
        current_user.loyalty_points += points_earned
        current_user.cumulative_sales += float(created_order.total_amount)
        await current_user.save()
    
    return {
        "message": "Order placed successfully",
        "order_number": created_order.order_number,
        "total_amount": created_order.total_amount
    }
