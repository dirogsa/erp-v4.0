from typing import List, Optional, Dict, Any
from datetime import datetime
from io import StringIO
import csv
from app.models.inventory import Product
from app.models.pricing import PriceList, PriceEntry
from app.exceptions.business_exceptions import NotFoundException, ValidationException
from beanie import PydanticObjectId

async def get_active_price(product_id: PydanticObjectId, quantity: int = 1, price_list_name: str = "General") -> Dict[str, Any]:
    """
    Busca el mejor precio disponible para un producto según cantidad y lista.
    Prioriza: Campañas Activas > Listas Específicas > Lista General.
    """
    # 1. Buscar la lista solicitada
    plist = await PriceList.find_one(PriceList.name == price_list_name, PriceList.is_active == True)
    if not plist:
        # Fallback a General si no existe la solicitada
        plist = await PriceList.find_one(PriceList.name == "General", PriceList.is_active == True)
    
    if not plist:
        return {"price": 0.0, "currency": "PEN", "list_name": "NONE"}

    # 2. Buscar campañas activas que puedan sobreescribir el precio (Prioridad)
    campaign = await PriceList.find_one(
        PriceList.is_campaign == True,
        PriceList.is_active == True,
        PriceList.start_date <= datetime.utcnow(),
        PriceList.end_date >= datetime.utcnow()
    ).sort("-priority")
    
    target_list_id = campaign.id if campaign else plist.id
    
    # 3. Buscar la entrada de precio que coincida con la cantidad (la mayor cantidad <= quantity)
    # Ejemplo: Si quantity=15 y hay precios para 1, 10 y 20. Debería elegir el de 10.
    price_entry = await PriceEntry.find(
        PriceEntry.product_id == product_id,
        PriceEntry.price_list_id == target_list_id,
        PriceEntry.min_quantity <= quantity
    ).sort("-min_quantity").first_or_none()

    if not price_entry and campaign:
        # Si no hubo precio en la campaña, buscar en la lista base
        price_entry = await PriceEntry.find(
            PriceEntry.product_id == product_id,
            PriceEntry.price_list_id == plist.id,
            PriceEntry.min_quantity <= quantity
        ).sort("-min_quantity").first_or_none()

    if not price_entry:
        return {"price": 0.0, "currency": "PEN", "list_name": "NOT_FOUND"}

    return {
        "price": price_entry.price,
        "currency": price_entry.currency,
        "list_name": campaign.name if campaign else plist.name,
        "min_quantity": price_entry.min_quantity
    }

async def update_price(
    sku: str, 
    price: float, 
    list_name: str = "General", 
    min_quantity: int = 1, 
    currency: str = "PEN"
):
    product = await Product.find_one(Product.sku == sku)
    if not product:
        raise NotFoundException("Product", sku)
    
    plist = await PriceList.find_one(PriceList.name == list_name)
    if not plist:
        # Auto-crear lista si no existe (Convenience)
        plist = PriceList(name=list_name)
        await plist.insert()
    
    # Upsert PriceEntry
    entry = await PriceEntry.find_one(
        PriceEntry.product_id == product.id,
        PriceEntry.price_list_id == plist.id,
        PriceEntry.min_quantity == min_quantity
    )
    
    if entry:
        entry.price = price
        entry.currency = currency
        entry.last_updated = datetime.utcnow()
        await entry.save()
    else:
        entry = PriceEntry(
            product_id=product.id,
            sku=sku,
            price_list_id=plist.id,
            price=price,
            currency=currency,
            min_quantity=min_quantity
        )
        await entry.insert()
    
    return entry

async def bulk_update_from_csv(csv_content: str, list_name: str = "General"):
    reader = csv.DictReader(StringIO(csv_content))
    updated = 0
    errors = []
    
    for row in reader:
        sku = row.get("sku", "").strip()
        price_str = row.get("price") or row.get("price_list")
        
        if not sku or not price_str:
            continue
            
        try:
            await update_price(sku=sku, price=float(price_str), list_name=list_name)
            updated += 1
        except Exception as e:
            errors.append({"sku": sku, "error": str(e)})
            
    return {"updated": updated, "errors": errors}
