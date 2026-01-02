from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
from ..models.inventory import Product, TechnicalSpec, CrossReference, Application, VehicleBrand, SearchLog
from app.models.auth import User, UserRole
from app.models.sales import SalesOrder, OrderItem, IssuerInfo, SalesQuote
from app.routes.auth import get_optional_user, get_current_user
from ..schemas.common import PaginatedResponse
from app.models.company import Company
from app.services import sales_service, sales_quotes_service
from datetime import datetime
from pydantic import BaseModel
from ..services.pricing_service import get_product_price_for_user

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

@router.get("/quotes", response_model=List[SalesQuote])
async def get_shop_quotes(current_user: User = Depends(get_current_user)):
    """Returns the history of quotations for the current user"""
    quotes = await SalesQuote.find(SalesQuote.customer_email == current_user.email).to_list()
    return sorted(quotes, key=lambda x: x.date, reverse=True)


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
        price = await get_product_price_for_user(p, 1, current_user)
        
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

    price = await get_product_price_for_user(p, 1, current_user)

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
        
        price = await get_product_price_for_user(
            product, 
            item.quantity, 
            current_user
        )
        
        order_items.append(OrderItem(
            product_sku=item.sku,
            product_name=product.name,
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

    # Create SalesQuote (Architecture change: Quotation first, then fulfillment)
    new_quote = SalesQuote(
        customer_name=req.customer_name,
        customer_email=current_user.email if current_user else None,
        customer_ruc=req.customer_ruc,
        items=order_items,
        delivery_address=req.delivery_address,
        delivery_branch_name=req.delivery_branch_name,
        issuer_info=issuer_info,
        date=datetime.now(),
        source="SHOP",
        notes=req.notes
    )

    created_quote = await sales_quotes_service.create_quote(new_quote)
    
    return {
        "message": "Quotation submitted successfully. Review it in the ERP to finalize your order.",
        "quote_number": created_quote.quote_number,
        "total_amount": created_quote.total_amount
    }
