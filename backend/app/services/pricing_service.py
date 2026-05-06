from typing import List, Optional, Dict, Any
from datetime import datetime
from ..models.pricing import PriceList, PriceEntry
from ..models.inventory import Product
from beanie import PydanticObjectId
from beanie.operators import In
import logging

logger = logging.getLogger(__name__)

class PricingService:
    @staticmethod
    async def get_product_price(sku: str, quantity: int = 1) -> Dict[str, Any]:
        """
        Enterprise-Grade Price Resolution Engine.
        Resolves prices based on Master Price + Active Campaigns.
        """
        now = datetime.utcnow()
        
        # 1. Get Master List (The Source of Truth)
        master_list = await PriceList.find_one(PriceList.is_master == True)
        if not master_list:
            # Fallback to any active list if no master is defined
            master_list = await PriceList.find_one(PriceList.is_active == True)
            
        if not master_list:
            return {"price": 0.0, "currency": "PEN", "source": "None", "error": "No price lists found"}

        # 2. Get Base Price from Master List
        # We search for the specific SKU and the appropriate quantity tier
        base_entry = await PriceEntry.find_one(
            PriceEntry.sku == sku,
            PriceEntry.price_list_id == master_list.id,
            PriceEntry.min_quantity <= quantity
        ).sort("-min_quantity") # Get the highest tier that fits the quantity

        if not base_entry:
            return {"price": 0.0, "currency": "PEN", "source": "Master", "error": "Product price not found in Master List"}

        final_price = base_entry.price
        currency = base_entry.currency
        source_name = master_list.name
        applied_campaign = None

        # 3. Look for Active Campaigns
        # Criteria: Active, is_campaign=True, within date range, sorted by priority
        active_campaigns = await PriceList.find(
            PriceList.is_active == True,
            PriceList.is_campaign == True,
            PriceList.start_date <= now,
            PriceList.end_date >= now
        ).sort("-priority").to_list()

        for campaign in active_campaigns:
            # Check if this campaign targets this specific SKU
            # If targeted_skus is empty, it's a global campaign
            is_targeted = not campaign.targeted_skus or sku in campaign.targeted_skus
            
            if is_targeted:
                # Apply the modifier from the campaign
                # default_discount_pct can be positive (discount) or negative (markup)
                modifier = (1 - (campaign.default_discount_pct / 100))
                final_price = base_entry.price * modifier
                applied_campaign = campaign.name
                source_name = f"Campaign: {campaign.name}"
                break # First one (highest priority) wins

        return {
            "sku": sku,
            "base_price": base_entry.price,
            "price": round(final_price, 2),
            "currency": currency,
            "source": source_name,
            "campaign": applied_campaign,
            "min_quantity": base_entry.min_quantity
        }

    @staticmethod
    async def get_bulk_prices(skus: List[str]) -> List[Dict[str, Any]]:
        """Optimized bulk price resolution."""
        results = []
        for sku in skus:
            price_info = await PricingService.get_product_price(sku)
            results.append(price_info)
        return results

    @staticmethod
    async def add_skus_to_campaign(campaign_id: PydanticObjectId, skus: List[str]):
        """
        Massive adjustment tool.
        Adds SKUs to a campaign's targeted list.
        """
        campaign = await PriceList.get(campaign_id)
        if not campaign:
            raise ValueError("Campaign not found")
        
        # Merge unique SKUs
        current_skus = set(campaign.targeted_skus)
        current_skus.update(skus)
        campaign.targeted_skus = list(current_skus)
        
        await campaign.save()
        return campaign

    @staticmethod
    async def set_master_price(sku: str, price: float, currency: str = "PEN"):
        """
        Set or update the Master Price for a product.
        This is the single point of entry for base prices.
        """
        master_list = await PriceList.find_one(PriceList.is_master == True)
        if not master_list:
            # Create master list if it doesn't exist
            master_list = PriceList(name="General", is_master=True, color="#6366f1")
            await master_list.insert()

        entry = await PriceEntry.find_one(
            PriceEntry.sku == sku, 
            PriceEntry.price_list_id == master_list.id,
            PriceEntry.min_quantity == 1
        )

        if entry:
            entry.price = price
            entry.currency = currency
            entry.last_updated = datetime.utcnow()
            await entry.save()
        else:
            # We need the product_id
            product = await Product.find_one(Product.sku == sku)
            if not product:
                raise ValueError(f"Product with SKU {sku} not found in inventory")
            
            entry = PriceEntry(
                product_id=product.id,
                sku=sku,
                price_list_id=master_list.id,
                price=price,
                currency=currency
            )
            await entry.insert()
        
        return entry
