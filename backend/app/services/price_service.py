from typing import List, Optional, Dict, Any
from datetime import datetime
from io import StringIO
import csv
from app.models.inventory import Product, PriceHistory, PriceListType
from app.exceptions.business_exceptions import NotFoundException, ValidationException
from app.schemas.common import PaginatedResponse

async def get_products_with_prices(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None
) -> PaginatedResponse[Product]:
    query = {}
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"sku": {"$regex": search, "$options": "i"}}
        ]

    total = await Product.find(query).count()
    items = await Product.find(query).skip(skip).limit(limit).to_list()
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=skip // limit + 1,
        pages=(total + limit - 1) // limit,
        size=limit
    )

async def update_product_price(
    sku: str,
    price_type: PriceListType,
    new_price: float,
    reason: Optional[str] = None,
    changed_by: Optional[str] = None
) -> Product:
    product = await Product.find_one(Product.sku == sku)
    if not product:
        raise NotFoundException("Product", sku)
    
    # Get old price
    # Get old price
    if price_type == PriceListType.RETAIL:
        old_price = product.price_retail
    else:
        old_price = product.price_wholesale
    
    # Skip if no change
    if old_price == new_price:
        return product
    
    # Create history entry
    history = PriceHistory(
        product_sku=sku,
        price_type=price_type,
        old_price=old_price,
        new_price=new_price,
        changed_at=datetime.now(),
        changed_by=changed_by,
        reason=reason
    )
    await history.insert()
    
    # Update product price
    # Update product price
    if price_type == PriceListType.RETAIL:
        product.price_retail = round(new_price, 3)
    else:
        product.price_wholesale = round(new_price, 3)
    
    await product.save()
    return product

async def get_price_history(
    sku: str,
    price_type: Optional[str] = None
) -> List[PriceHistory]:
    query = {"product_sku": sku}
    if price_type:
        query["price_type"] = price_type
    
    return await PriceHistory.find(query).sort("-changed_at").to_list()

async def bulk_update_prices(
    updates: List[Dict[str, Any]],
    reason: Optional[str] = None,
    changed_by: Optional[str] = None
) -> Dict[str, Any]:
    """
    Bulk update prices from a list of dicts.
    Each dict should have: sku, price (retail), price_wholesale (optional)
    """
    updated = 0
    errors = []
    
    for item in updates:
        sku = item.get("sku")
        if not sku:
            errors.append({"error": "Missing SKU", "data": item})
            continue
            
        try:
            # Update retail price if provided
            if "price" in item and item["price"] is not None:
                await update_product_price(
                    sku=sku,
                    price_type=PriceListType.RETAIL,
                    new_price=float(item["price"]),
                    reason=reason,
                    changed_by=changed_by
                )
                updated += 1
            
            # Update wholesale price if provided
            if "price_wholesale" in item and item["price_wholesale"] is not None:
                await update_product_price(
                    sku=sku,
                    price_type=PriceListType.WHOLESALE,
                    new_price=float(item["price_wholesale"]),
                    reason=reason,
                    changed_by=changed_by
                )
                
        except NotFoundException:
            errors.append({"error": f"Product {sku} not found", "sku": sku})
        except Exception as e:
            errors.append({"error": str(e), "sku": sku})
    
    return {
        "updated": updated,
        "errors": errors,
        "total_processed": len(updates)
    }

async def parse_csv_prices(csv_content: str) -> List[Dict[str, Any]]:
    """
    Parse CSV content for price updates.
    Expected columns: sku, price, price_wholesale (optional)
    """
    reader = csv.DictReader(StringIO(csv_content))
    updates = []
    
    for row in reader:
        update = {"sku": row.get("sku", "").strip()}
        
        if "price" in row and row["price"]:
            try:
                update["price"] = float(row["price"])
            except ValueError:
                pass
                
        if "price_wholesale" in row and row["price_wholesale"]:
            try:
                update["price_wholesale"] = float(row["price_wholesale"])
            except ValueError:
                pass
        
        if update.get("sku"):
            updates.append(update)
    
    return updates
