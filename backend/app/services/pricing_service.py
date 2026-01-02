from typing import Optional
from ..models.auth import UserTier, UserRole
from ..models.inventory import Product
from ..models.pricing import PricingRule

async def get_product_price_for_user(product: Product, quantity: int, user: Optional[any] = None) -> float:
    """
    Calculates the final price for a product based on user classification, 
    volume discounts, and custom user discounts.
    """
    role = user.role if user else UserRole.CUSTOMER_B2C
    tier = user.classification if user else UserTier.STANDARD
    user_discount = user.custom_discount_percent if user else 0.0

    # 1. Base Price by Role
    base_price = product.price_wholesale if role == UserRole.CUSTOMER_B2B else product.price_retail

    # 2. Get applicable Pricing Rules (Tier-based)
    # Rules can be Category + Brand, just Category, or just Brand.
    # We look for the most specific rule first.
    rules = await PricingRule.find(
        PricingRule.tier == tier,
        PricingRule.is_active == True
    ).to_list()

    best_rule_discount = 0.0
    for rule in rules:
        # Check Brand match
        brand_match = not rule.brand or rule.brand == product.brand
        # Check Category match
        category_match = not rule.category_id or rule.category_id == product.category_id
        
        if brand_match and category_match:
            # If multiple rules match, we take the highest discount? Or additive? 
            # Usually highest discount per tier is safer for the admin.
            best_rule_discount = max(best_rule_discount, rule.discount_percentage)

    # 3. Volume Discount (from product)
    vol_discount_pct = 0.0
    if quantity >= 24:
        vol_discount_pct = product.discount_24_pct
    elif quantity >= 12:
        vol_discount_pct = product.discount_12_pct
    elif quantity >= 6:
        vol_discount_pct = product.discount_6_pct

    # 4. Final Calculation
    # Strategy: BasePrice * (1 - RuleDisc) * (1 - VolDisc) * (1 - UserDisc)
    price_after_rules = base_price * (1 - (best_rule_discount / 100))
    price_after_vol = price_after_rules * (1 - (vol_discount_pct / 100))
    final_price = price_after_vol * (1 - (user_discount / 100))

    return round(final_price, 3)
