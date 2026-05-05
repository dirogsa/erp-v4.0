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
from pydantic import BaseModel, ConfigDict, Field

class ProductShort(BaseModel):
    id: Optional[PydanticObjectId] = Field(None, alias="_id")
    sku: str
    brand: str
    name: Optional[str] = None
    price_list: Optional[float] = 0.0
    cost: Optional[float] = 0.0
    category_id: Optional[Any] = None
    
    model_config = ConfigDict(populate_by_name=True)

from app.services import currency_service

async def get_active_price(
    product_id: PydanticObjectId, 
    quantity: int = 1, 
    price_list_name: Optional[str] = None, 
    user: Optional[User] = None,
    target_currency: Optional[str] = None
) -> Dict[str, Any]:
    """
    Busca el mejor precio disponible para un producto según cantidad y lista.
    Realiza conversión automática si la moneda solicitada difiere de la base.
    """
    # 0. Determinar moneda objetivo
    # Si no se especifica, usamos la moneda de reporte global por ahora
    # TODO: En el futuro pasar company_id para usar functional_currency
    base_currency = await currency_service.get_reporting_currency()
    final_currency = target_currency or base_currency
    
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

    # 2. Buscar la lista solicitada y el producto
    plist = await PriceList.find_one(PriceList.name == target_list_name, PriceList.is_active == True)
    if not plist:
        plist = await PriceList.find_one(PriceList.name == "General", PriceList.is_active == True)
    
    product = await Product.get(product_id)
    if not product:
        return {"price": 0.0, "currency": "PEN", "list_name": "PRODUCT_NOT_FOUND"}

    # 3. Resolución de Precio (Jerarquía: Campaña > Excepción de Lista > Regla de Porcentaje > Maestro)
    campaign = await PriceList.find_one(
        PriceList.is_campaign == True,
        PriceList.is_active == True,
        PriceList.start_date <= datetime.utcnow(),
        PriceList.end_date >= datetime.utcnow()
    ).sort("-priority")
    
    # Elegir la lista de la que tomaremos la regla/precio
    active_plist = campaign if campaign else plist
    target_list_id = active_plist.id if active_plist else None
    
    # Intentar buscar una entrada específica (Excepción Manual)
    price_entry = None
    if target_list_id:
        price_entry = await PriceEntry.find(
            PriceEntry.product_id == product_id,
            PriceEntry.price_list_id == target_list_id,
            PriceEntry.min_quantity <= quantity
        ).sort("-min_quantity").first_or_none()

    final_price = 0.0
    source = "master"
    
    if price_entry:
        # Existe un precio manual (Excepción)
        final_price = price_entry.price
        source = "campaign_manual" if campaign else "list_manual"
    elif active_plist and active_plist.discount_percentage > 0:
        # Aplicar Regla de Porcentaje sobre el Precio Base (Estrategia Dinámica)
        discount = active_plist.discount_percentage
        final_price = round(product.price_list * (1 - (discount / 100.0)), 2)
        source = "dynamic_percentage"
    else:
        # Usar Precio Maestro del Inventario
        final_price = product.price_list
        source = "product_master"

    # 4. Conversión de Moneda Final (si la moneda objetivo es distinta a la de origen)
    entry_currency = price_entry.currency if price_entry else base_currency
    
    if final_currency != entry_currency:
        final_price = await currency_service.convert_amount(final_price, entry_currency, final_currency)

    # 5. Motor de Reglas Globales (Fallback de Volumen)
    # Se aplica solo si estamos en la cantidad mínima base
    current_min_qty = price_entry.min_quantity if price_entry else 1
    
    if current_min_qty == 1 and quantity > 1:
        policy = await SalesPolicy.find_one({})
        if policy:
            discount_pct = 0.0
            if quantity >= 12: discount_pct = policy.vol_12_discount_pct
            elif quantity >= 6: discount_pct = policy.vol_6_discount_pct
            elif quantity >= 3: discount_pct = policy.vol_3_discount_pct
            
            if discount_pct > 0:
                final_price = round(final_price * (1 - (discount_pct / 100.0)), 2)

    return {
        "price": final_price,
        "currency": final_currency,
        "list_name": target_list_name,
        "source": source,
        "min_quantity": current_min_qty
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
        if list_name.lower() == "general" and min_quantity == 1:
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
    # Optimización Enterprise: Recuperar solo campos necesarios mediante Proyección de Modelo
    products = await Product.find(
        {"sku": {"$in": skus}}
    ).project(ProductShort).to_list()
    
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

async def bulk_update_prices(
    items: List[Dict[str, Any]], 
    list_name: str = "General", 
    mode: str = "price",
    input_currency: str = "PEN"
) -> Dict[str, Any]:
    """
    Enterprise-grade bulk update service.
    Handles atomic updates across Products, PriceEntries and Audit Logs.
    Supports multi-currency input with automatic conversion for base valuation.
    """
    from app.models.inventory import Product, PriceHistory
    from app.models.pricing import PriceList, PriceEntry
    from pymongo import UpdateOne
    
    # 0. Obtener moneda de reporte del sistema
    base_currency = await currency_service.get_reporting_currency()
    needs_conversion = input_currency != base_currency
    
    # 1. Resolver metadatos de la lista (Contexto de Dominio)
    plist = await PriceList.find_one({"name": list_name})
    if not plist:
        # Auto-curación: Si es "General", la marcamos como maestra por defecto
        is_master = list_name.lower() == "general"
        plist = PriceList(
            name=list_name, 
            is_master=is_master,
            description="Lista de precios maestra creada por el sistema" if is_master else "Lista comercial"
        )
        await plist.insert()
    
    is_master_list = plist.is_master
    plist_id = plist.id
    
    # 2. Normalización y Preparación
    items_normalized = []
    for item in items:
        sku = normalize_sku(item.get("sku", ""))
        brand = item.get("brand", "OEM")
        if sku:
            items_normalized.append({
                "sku": sku,
                "brand": brand,
                "proposed_price": item.get("price"),
                "proposed_cost": item.get("cost")
            })
            
    skus = [item["sku"] for item in items_normalized]
    products = await Product.find({"sku": {"$in": skus}}).project(ProductShort).to_list()
    product_map = {(p.sku, p.brand): p for p in products}
    
    # 3. Preparación de Operaciones Masivas (Bulk Ops)
    product_ops = []      # Updates for 'products' collection
    price_entry_ops = []  # Updates for 'price_entries' collection
    history_entries = []  # Audit logs
    
    updated_count = 0
    errors = []
    
    now = datetime.utcnow()
    
    for item in items_normalized:
        product = product_map.get((item["sku"], item["brand"]))
        if not product:
            errors.append({"sku": item["sku"], "error": "Producto no encontrado en el Maestro"})
            continue
            
        proposed_price = item["proposed_price"]
        proposed_cost = item["proposed_cost"]
        
        # --- Conversión Dinámica (Solo para Valoración Maestra) ---
        price_for_master = proposed_price
        cost_for_master = proposed_cost
        
        if needs_conversion:
            if price_for_master is not None:
                price_for_master = await currency_service.convert_amount(price_for_master, input_currency, base_currency)
            if cost_for_master is not None:
                cost_for_master = await currency_service.convert_amount(cost_for_master, input_currency, base_currency)

        # --- Lógica de Consolidación de Producto (Verdad Única en Moneda Base) ---
        update_fields = {}
        if cost_for_master is not None and cost_for_master != product.cost:
            update_fields["cost"] = cost_for_master
            
        if is_master_list and price_for_master is not None and price_for_master != product.price_list:
            update_fields["price_list"] = price_for_master
            
        if update_fields:
            product_ops.append(UpdateOne({"_id": product.id}, {"$set": update_fields}))
            # Generar registro de auditoría
            if "price_list" in update_fields:
                history_entries.append(PriceHistory(
                    product_sku=product.sku,
                    price_type="LIST",
                    old_price=product.price_list,
                    new_price=price_for_master,
                    company_id="SYSTEM",
                    reason=f"Actualización Masiva ({input_currency} -> {base_currency})" if needs_conversion else "Actualización de Precio Maestro"
                ))

        # --- Lógica de Lista de Precios (Solo para Campañas/Excepciones) ---
        # Si NO es la lista maestra, guardamos una entrada específica (en su moneda original)
        if not is_master_list and proposed_price is not None:
            price_entry_ops.append(
                UpdateOne(
                    {"product_id": product.id, "price_list_id": plist_id, "min_quantity": 1},
                    {"$set": {
                        "sku": product.sku,
                        "price": proposed_price,
                        "currency": input_currency,
                        "last_updated": now
                    }},
                    upsert=True
                )
            )
            # Auditoría para excepciones de lista
            history_entries.append(PriceHistory(
                product_sku=product.sku,
                price_type="LIST",
                old_price=0.0,
                new_price=price_for_master, # Guardamos el equivalente en moneda base para auditoría uniforme
                company_id="SYSTEM",
                reason=f"Excepción manual en lista: {list_name} ({input_currency})"
            ))
        
        updated_count += 1
        
    # 4. Ejecución Atómica (Commit)
    if product_ops:
        await Product.get_pymongo_collection().bulk_write(product_ops, ordered=False)
    
    if price_entry_ops:
        await PriceEntry.get_pymongo_collection().bulk_write(price_entry_ops, ordered=False)
        
    if history_entries:
        # Insertar historial de forma asíncrona pero masiva
        await PriceHistory.insert_many(history_entries)
        
    return {
        "status": "success",
        "updated": updated_count,
        "errors": errors,
        "audit_logs_created": len(history_entries)
    }
