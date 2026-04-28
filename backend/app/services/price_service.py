from typing import List, Optional, Dict, Any
from datetime import datetime
from io import StringIO
import csv
from app.models.inventory import Product
from app.models.pricing import PriceList, PriceEntry
from app.models.sales import SalesPolicy
from app.exceptions.business_exceptions import NotFoundException, ValidationException
from beanie import PydanticObjectId
from app.models.auth import User, UserTier
from app.utils.norm_utils import normalize_sku

async def get_active_price(product_id: PydanticObjectId, quantity: int = 1, price_list_name: Optional[str] = None, user: Optional[User] = None) -> Dict[str, Any]:
    """
    Busca el mejor precio disponible para un producto según cantidad y lista.
    Prioriza: Campañas Activas > Listas Específicas del Usuario/Tier > Lista General.
    """
    # 1. Resolución de la lista objetivo
    target_list_name = price_list_name
    
    if not target_list_name and user:
        if user.assigned_price_list:
            target_list_name = user.assigned_price_list
        else:
            # Mapeo profesional de Tiers a Listas
            tier_map = {
                UserTier.BRONCE: "Lista Bronce",
                UserTier.PLATA: "Lista Plata",
                UserTier.ORO: "Lista Oro",
                UserTier.DIAMANTE: "Lista Diamante"
            }
            target_list_name = tier_map.get(user.classification, "General")
            
    if not target_list_name:
        target_list_name = "General"

    # 2. Buscar la lista solicitada
    plist = await PriceList.find_one(PriceList.name == target_list_name, PriceList.is_active == True)
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

    # 4. Motor de Reglas Globales (Fallback de Volumen)
    # Si la entrada que encontramos es el precio base (min_quantity=1), 
    # pero el usuario está llevando más cantidad, aplicamos la regla global por defecto de la empresa.
    final_price = price_entry.price
    if price_entry.min_quantity == 1 and quantity > 1:
        policy = await SalesPolicy.find_one({})
        if policy:
            discount_pct = 0.0
            if quantity >= 12: discount_pct = policy.vol_12_discount_pct
            elif quantity >= 6: discount_pct = policy.vol_6_discount_pct
            elif quantity >= 3: discount_pct = policy.vol_3_discount_pct
            
            if discount_pct > 0:
                final_price = round(final_price * (1 - (discount_pct / 100.0)), 4)

    return {
        "price": final_price,
        "currency": price_entry.currency,
        "list_name": campaign.name if campaign else plist.name,
        "min_quantity": price_entry.min_quantity
    }

async def update_price(
    sku: str, 
    brand: Optional[str] = None,
    price: Optional[float] = None, 
    cost: Optional[float] = None,
    list_name: str = "General", 
    min_quantity: int = 1, 
    currency: str = "PEN"
):
    # Normalizar SKU antes de buscar
    sku = normalize_sku(sku)
    
    # Búsqueda por identidad compuesta (SKU + Marca)
    query = {"sku": sku}
    if brand:
        query["brand"] = brand
    
    product = await Product.find_one(query)
    
    if not product and not brand:
        # Si no se dio marca y hay ambigüedad, lanzamos error específico
        candidates = await Product.find({"sku": sku}).to_list()
        if len(candidates) > 1:
            raise ValidationException(f"El SKU {sku} es ambiguo. Se encuentra en {len(candidates)} marcas. Por favor especifique marca.")
    
    if not product:
        raise NotFoundException("Product", f"{sku} ({brand or 'Cualquiera'})")
    
    # 1. Si se proporciona costo, actualizar el producto directamente (Global)
    if cost is not None:
        product.cost = cost
        await product.save()

    # 2. Si se proporciona precio, actualizar la entrada en la lista
    if price is not None:
        plist = await PriceList.find_one(PriceList.name == list_name)
        if not plist:
            plist = PriceList(name=list_name)
            await plist.insert()
        
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
        
        # Sincronizar con el campo price_list del producto si es la lista General
        if list_name == "General" and min_quantity == 1:
            product.price_list = price
            await product.save()
            
        return entry
    
    return product

async def bulk_update_from_csv(csv_content: str, list_name: str = "General"):
    reader = csv.DictReader(StringIO(csv_content))
    updated = 0
    errors = []
    
    for row in reader:
        sku = row.get("sku", "").strip()
        brand = row.get("brand", "").strip() or None
        price_str = row.get("price") or row.get("price_list")
        cost_str = row.get("cost")
        
        if not sku:
            continue
            
        try:
            await update_price(
                sku=sku, 
                brand=brand,
                price=float(price_str) if price_str else None, 
                cost=float(cost_str) if cost_str else None,
                list_name=list_name
            )
            updated += 1
        except Exception as e:
            errors.append({"sku": sku, "brand": brand, "error": str(e)})
            
    return {"updated": updated, "errors": errors}

async def analyze_bulk_prices(items: List[Dict[str, Any]], list_name: str = "General", mode: str = "price") -> Dict[str, Any]:
    """
    Analiza una lista de SKUs, precios y costos propuestos.
    Calcula el margen proyectado.
    """
    valid = []
    unrecognized = []
    
    # Normalizar SKUs de entrada
    items_normalized = []
    for item in items:
        new_item = {**item, "sku": normalize_sku(item["sku"])}
        items_normalized.append(new_item)
    
    skus = [item["sku"] for item in items_normalized]
    products = await Product.find({"sku": {"$in": skus}}).to_list()
    
    # Mapeo por (sku, brand) para evitar colisiones
    product_map = {(p.sku, p.brand): p for p in products}
    
    # Mapeo auxiliar para detectar ambigüedad si no viene marca
    sku_to_brands = {}
    for p in products:
        if p.sku not in sku_to_brands: sku_to_brands[p.sku] = []
        sku_to_brands[p.sku].append(p.brand)
    
    plist = await PriceList.find_one(PriceList.name == list_name)
    plist_id = plist.id if plist else None

    # Optimización: Cargar todos los PriceEntries en memoria para evitar N+1 queries
    price_entry_map = {}
    if plist_id and products:
        product_ids = [p.id for p in products]
        # Traer todas las entradas de una vez
        entries = await PriceEntry.find(
            {"product_id": {"$in": product_ids}, "price_list_id": plist_id, "min_quantity": 1}
        ).to_list()
        price_entry_map = {e.product_id: e for e in entries}

    for item in items_normalized:
        sku = item["sku"]
        brand = item.get("brand")
        proposed_price = item.get("price")
        proposed_cost = item.get("cost")
        
        # Intentar match por (sku, brand) o fallback a sku si es único
        product = product_map.get((sku, brand))
        
        if not product and not brand:
            # Si no hay marca, ver si el SKU es único
            brands = sku_to_brands.get(sku, [])
            if len(brands) == 1:
                product = product_map.get((sku, brands[0]))
            elif len(brands) > 1:
                unrecognized.append({
                    "sku": sku,
                    "brand": "AMBIGUO",
                    "error": f"SKU duplicado en marcas: {', '.join(brands)}",
                    "exists": False
                })
                continue

        if product:
            # Precio Actual en la lista
            current_price = 0.0
            if plist_id:
                entry = price_entry_map.get(product.id)
                current_price = entry.price if entry else product.price_list
            else:
                current_price = product.price_list

            current_cost = product.cost or 0.0
            
            # Valores finales para el cálculo de margen (usar propuesto o actual)
            final_cost = proposed_cost if proposed_cost is not None else current_cost
            final_price = proposed_price if proposed_price is not None else current_price
            
            # Cálculo de Margen Bruto: ((Precio - Costo) / Precio) * 100
            margin = 0.0
            if final_price > 0:
                margin = ((final_price - final_cost) / final_price) * 100

            valid.append({
                "sku": sku,
                "brand": product.brand,
                "name": product.name,
                "current_price": current_price,
                "proposed_price": proposed_price,
                "current_cost": current_cost,
                "proposed_cost": proposed_cost,
                "margin": round(margin, 2),
                "exists": True
            })
        else:
            if not any(u["sku"] == sku for u in unrecognized):
                unrecognized.append({
                    "sku": sku,
                    "brand": brand or "N/A",
                    "proposed_price": proposed_price,
                    "proposed_cost": proposed_cost,
                    "exists": False
                })
            
    return {
        "valid": valid,
        "unrecognized": unrecognized,
        "total": len(items),
        "mode": mode
    }

async def bulk_update_prices(items: List[Dict[str, Any]], list_name: str = "General", mode: str = "price") -> Dict[str, Any]:
    from pymongo import UpdateOne
    
    # Normalizar SKUs de entrada
    items_normalized = []
    for item in items:
        new_item = {**item, "sku": normalize_sku(item["sku"])}
        items_normalized.append(new_item)
    
    skus = [item["sku"] for item in items_normalized]
    products = await Product.find({"sku": {"$in": skus}}).to_list()
    product_map = {(p.sku, p.brand): p for p in products}
    sku_to_brands = {}
    for p in products:
        if p.sku not in sku_to_brands: sku_to_brands[p.sku] = []
        sku_to_brands[p.sku].append(p.brand)
        
    plist = await PriceList.find_one(PriceList.name == list_name)
    if not plist:
        plist = PriceList(name=list_name)
        await plist.insert()
        
    plist_id = plist.id
    
    product_ops = []
    price_entry_ops = []
    
    updated = 0
    errors = []
    
    for item in items_normalized:
        sku = item["sku"]
        brand = item.get("brand")
        proposed_price = item.get("price")
        proposed_cost = item.get("cost")
        
        product = product_map.get((sku, brand))
        
        if not product and not brand:
            brands = sku_to_brands.get(sku, [])
            if len(brands) == 1:
                product = product_map.get((sku, brands[0]))
            elif len(brands) > 1:
                errors.append({"sku": sku, "error": f"El SKU {sku} es ambiguo. Especifique marca."})
                continue
                
        if not product:
            errors.append({"sku": sku, "error": f"Producto no encontrado: {sku}"})
            continue
            
        # Update cost
        if proposed_cost is not None:
            product_ops.append(
                UpdateOne({"_id": product.id}, {"$set": {"cost": proposed_cost}})
            )
            
        # Update price
        if proposed_price is not None:
            price_entry_ops.append(
                UpdateOne(
                    {"product_id": product.id, "price_list_id": plist_id, "min_quantity": 1},
                    {"$set": {
                        "sku": product.sku, 
                        "price": proposed_price, 
                        "currency": "PEN", 
                        "last_updated": datetime.utcnow()
                    }},
                    upsert=True
                )
            )
            # Sincronizar con el campo price_list del producto si es la lista General
            if list_name == "General":
                product_ops.append(
                    UpdateOne({"_id": product.id}, {"$set": {"price_list": proposed_price}})
                )
            
        updated += 1
        
    if product_ops:
        await Product.get_pymongo_collection().bulk_write(product_ops, ordered=False)
        
    if price_entry_ops:
        await PriceEntry.get_pymongo_collection().bulk_write(price_entry_ops, ordered=False)
        
    return {"updated": updated, "errors": errors}

