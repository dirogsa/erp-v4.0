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
        base_entry = await PriceEntry.find(
            PriceEntry.sku == sku,
            PriceEntry.price_list_id == master_list.id,
            PriceEntry.min_quantity <= quantity
        ).sort("-min_quantity").first_or_none() # Get the highest tier that fits the quantity

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
    @staticmethod
    async def analyze_bulk(items: List[Dict[str, Any]], list_name: str, mode: str) -> Dict[str, Any]:
        """
        Analyzes a list of SKUs to find current prices and costs.
        Optimized for large lists to avoid timeouts.
        """
        valid = []
        unrecognized = []
        
        if not items:
            return {"valid": [], "unrecognized": []}

        # 1. Pre-fetch all necessary reference data
        skus = [i.get("sku") for i in items if i.get("sku")]
        
        # Get all products in one go
        all_products = await Product.find(In(Product.sku, skus)).to_list()
        product_map = {}
        sku_counts = {}
        for p in all_products:
            sku_counts[p.sku] = sku_counts.get(p.sku, 0) + 1
            # Map by SKU + Brand for exact match, and also just SKU for simple lookup
            product_map[f"{p.sku}_{p.brand}"] = p
            if p.sku not in product_map:
                product_map[p.sku] = p

        # Pre-fetch master list and active campaigns
        now = datetime.utcnow()
        master_list = await PriceList.find_one(PriceList.is_master == True)
        if not master_list:
            master_list = await PriceList.find_one(PriceList.is_active == True)
        
        active_campaigns = await PriceList.find(
            PriceList.is_active == True,
            PriceList.is_campaign == True,
            PriceList.start_date <= now,
            PriceList.end_date >= now
        ).sort("-priority").to_list()

        # Pre-fetch all master price entries for these SKUs
        master_entries = await PriceEntry.find(
            In(PriceEntry.sku, skus),
            PriceEntry.price_list_id == master_list.id,
            PriceEntry.min_quantity == 1
        ).to_list()
        entry_map = {e.sku: e for e in master_entries}

        # 2. Process items using pre-fetched data
        for item in items:
            sku = item.get("sku")
            brand = item.get("brand")
            proposed_price = item.get("price")
            proposed_cost = item.get("cost")

            # Find product
            product = None
            if brand:
                product = product_map.get(f"{sku}_{brand}")
            else:
                product = product_map.get(sku)
            
            if not product:
                unrecognized.append({"sku": sku, "brand": brand, "reason": "No encontrado"})
                continue
            
            # Ambiguity check
            if not brand and sku_counts.get(sku, 0) > 1:
                unrecognized.append({"sku": sku, "brand": "AMBIGUO", "reason": "Múltiples marcas"})
                continue

            # Resolve Price (Optimized version of get_product_price logic)
            base_entry = entry_map.get(sku)
            current_price = base_entry.price if base_entry else 0.0
            
            # Apply campaigns
            for campaign in active_campaigns:
                is_targeted = not campaign.targeted_skus or sku in campaign.targeted_skus
                if is_targeted:
                    modifier = (1 - (campaign.default_discount_pct / 100))
                    current_price = current_price * modifier
                    break
            
            current_cost = product.cost or 0.0

            # Margin calculation
            p_price = proposed_price if proposed_price is not None else current_price
            p_cost = proposed_cost if proposed_cost is not None else current_cost
            
            margin = 0
            if p_price > 0:
                margin = ((p_price - p_cost) / p_price) * 100

            valid.append({
                "sku": sku,
                "brand": product.brand,
                "name": product.name,
                "current_price": round(current_price, 2),
                "current_cost": round(current_cost, 2),
                "proposed_price": proposed_price,
                "proposed_cost": proposed_cost,
                "margin": margin
            })

        return {"valid": valid, "unrecognized": unrecognized}

    @staticmethod
    async def bulk_update(items: List[Dict[str, Any]], list_name: str, mode: str) -> Dict[str, Any]:
        """
        Executes massive updates for prices and costs using optimized bulk operations.
        """
        if not items:
            return {"updated": 0, "errors": [], "success": True}

        updated_count = 0
        errors = []
        
        # 1. Prepare Data & Context
        skus = [i.get("sku") for i in items if i.get("sku")]
        master_list = await PriceList.find_one(PriceList.is_master == True)
        if not master_list:
            master_list = await PriceList.find_one(PriceList.is_active == True)
        
        if not master_list:
            return {"updated": 0, "errors": [{"error": "No se encontró lista maestra"}], "success": False}

        # Pre-fetch existing price entries and products
        existing_entries = await PriceEntry.find(
            In(PriceEntry.sku, skus),
            PriceEntry.price_list_id == master_list.id,
            PriceEntry.min_quantity == 1
        ).to_list()
        entry_map = {e.sku: e for e in existing_entries}
        
        all_products = await Product.find(In(Product.sku, skus)).to_list()
        # Map by SKU + Brand for exact match, and also just SKU for simple lookup
        product_map = {}
        for p in all_products:
            product_map[f"{p.sku}_{p.brand}"] = p
            if p.sku not in product_map:
                product_map[p.sku] = p

        # 2. Build tasks for parallel execution
        tasks = []
        now = datetime.utcnow()
        
        async def update_item_task(item):
            nonlocal updated_count
            sku = item.get("sku")
            brand = item.get("brand")
            price = item.get("price")
            cost = item.get("cost")
            
            try:
                # A. Update Product Cost
                if cost is not None:
                    product = product_map.get(f"{sku}_{brand}") if brand else product_map.get(sku)
                    if product:
                        await Product.find_one({"_id": product.id}).update({"$set": {"cost": cost}})
                    else:
                        return {"sku": sku, "error": "Producto no encontrado (Costo)"}

                # B. Update/Create Master Price
                if price is not None:
                    entry = entry_map.get(sku)
                    if entry:
                        await PriceEntry.find_one({"_id": entry.id}).update({
                            "$set": {"price": price, "last_updated": now}
                        })
                    else:
                        product = product_map.get(f"{sku}_{brand}") if brand else product_map.get(sku)
                        if product:
                            new_entry = PriceEntry(
                                product_id=product.id,
                                sku=sku,
                                price_list_id=master_list.id,
                                price=price,
                                currency="PEN"
                            )
                            await new_entry.insert()
                        else:
                            return {"sku": sku, "error": "Producto no encontrado (Precio)"}
                
                return None # Success
            except Exception as e:
                return {"sku": sku, "error": str(e)}

        # Run everything in parallel
        import asyncio
        results = await asyncio.gather(*(update_item_task(i) for i in items))
        
        # Aggregate results
        for res in results:
            if res:
                errors.append(res)
            else:
                updated_count += 1

        return {
            "updated": updated_count,
            "errors": errors,
            "success": len(errors) == 0
        }

    @staticmethod
    async def purge_master_prices():
        """
        DANGER: Deletes all entries from the Master Price List.
        """
        master_list = await PriceList.find_one(PriceList.is_master == True)
        if not master_list:
            master_list = await PriceList.find_one(PriceList.is_active == True)
        
        if master_list:
            # Delete all entries for this list
            await PriceEntry.find(PriceEntry.price_list_id == master_list.id).delete()
            return {"message": f"Todos los precios de la lista {master_list.name} han sido eliminados."}
        return {"error": "No se encontró lista maestra para purgar."}

    @staticmethod
    async def reset_all_costs():
        """
        DANGER: Resets cost to 0.0 for ALL products in the catalog.
        """
        # We use direct MongoDB update for performance on large catalogs
        await Product.get_pymongo_collection().update_many({}, {"$set": {"cost": 0.0}})
        return {"message": "Todos los costos del catálogo han sido reseteados a 0.00."}
