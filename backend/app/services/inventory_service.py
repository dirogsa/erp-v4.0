from typing import List, Optional, Dict, Any
from datetime import datetime
from app.models.inventory import Product, StockMovement, MovementType, Warehouse
from app.exceptions.business_exceptions import NotFoundException, ValidationException, InsufficientStockException, DuplicateEntityException
from app.services.brand_service import ensure_brands_exist

from app.schemas.common import PaginatedResponse

async def get_products(
    skip: int = 0, 
    limit: int = 50, 
    search: Optional[str] = None, 
    category: Optional[str] = None
) -> PaginatedResponse[Product]:
    query = {}
    
    if search:
        # Búsqueda multi-campo usando los índices de texto y Regex seguro
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"sku": {"$regex": search, "$options": "i"}},
            {"brand": {"$regex": search, "$options": "i"}},
            {"equivalences.code": {"$regex": search, "$options": "i"}},
            {"applications.model": {"$regex": search, "$options": "i"}},
            # Intentar búsqueda exacta en aplicaciones por si acaso
            {"applications.make": {"$regex": search, "$options": "i"}}
        ]
        
    if category:
        query["category_id"] = category
        
    total = await Product.find(query).count()
    items = await Product.find(query).skip(skip).limit(limit).to_list()
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=skip // limit + 1,
        pages=(total + limit - 1) // limit,
        size=limit
    )

async def get_product_by_sku(sku: str) -> Product:
    product = await Product.find_one(Product.sku == sku)
    if not product:
        raise NotFoundException("Product", sku)
    return product

async def create_product(product_data: Product, initial_stock: int = 0) -> Product:
    existing = await Product.find_one(Product.sku == product_data.sku)
    if existing:
        raise DuplicateEntityException("Product", "sku", product_data.sku)
    
    # Set initial stock
    product_data.stock_current = initial_stock
    await product_data.insert()
    
    if initial_stock > 0:
        movement = StockMovement(
            product_sku=product_data.sku,
            quantity=initial_stock,
            movement_type=MovementType.IN,
            notes="Inventario Inicial",
            date=datetime.now(),
            unit_cost=product_data.cost,
            reference_document=f"INITIAL-{product_data.sku}"
        )
        await movement.insert()
        
    # Auto-register vehicle brands from applications
    if product_data.applications:
        await ensure_brands_exist([app.make for app in product_data.applications])
        
    return product_data

async def update_product(sku: str, update_data: Product, new_stock: int = None) -> Product:
    product = await get_product_by_sku(sku)
    
    # Update all editable fields from update_data
    product.name = update_data.name
    product.brand = update_data.brand
    product.description = update_data.description
    product.image_url = update_data.image_url
    product.weight_g = update_data.weight_g
    
    # Category & Attributes
    product.category_id = update_data.category_id
    product.custom_attributes = update_data.custom_attributes
    product.features = update_data.features
    
    # Pricing
    product.price_retail = update_data.price_retail
    product.price_wholesale = update_data.price_wholesale
    product.discount_6_pct = update_data.discount_6_pct
    product.discount_12_pct = update_data.discount_12_pct
    product.discount_24_pct = update_data.discount_24_pct
    product.cost = update_data.cost
    product.loyalty_points = update_data.loyalty_points
    
    # Technical data
    product.specs = update_data.specs
    product.equivalences = update_data.equivalences
    product.applications = update_data.applications
    
    # Shop visibility flags
    product.is_new = update_data.is_new
    product.is_active_in_shop = update_data.is_active_in_shop
    
    await product.save()
    
    # Auto-register/sync vehicle brands from applications
    if product.applications:
        await ensure_brands_exist([app.make for app in product.applications])
    
    if new_stock is not None and new_stock != product.stock_current:
        product = await adjust_stock(sku, new_stock, "Ajuste desde edición de producto")
        
    return product

async def delete_product(sku: str) -> bool:
    product = await Product.find_one(Product.sku == sku)
    if not product:
        raise NotFoundException("Product", sku)
    await product.delete()
    return True

async def adjust_stock(sku: str, new_quantity: int, notes: str, movement_type: MovementType = MovementType.ADJUSTMENT) -> Product:
    product = await get_product_by_sku(sku)
    
    diff = new_quantity - product.stock_current
    if diff == 0:
        return product
        
    # Determine if it's IN or OUT based on difference if generic ADJUSTMENT is used
    if movement_type == MovementType.ADJUSTMENT:
        actual_type = MovementType.IN if diff > 0 else MovementType.OUT
    else:
        actual_type = movement_type

    movement = StockMovement(
        product_sku=sku,
        quantity=abs(diff),
        movement_type=actual_type,
        notes=notes,
        date=datetime.now(),
        unit_cost=product.cost,
        reference_document=f"ADJUST-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    )
    await movement.insert()
    
    product.stock_current = new_quantity
    await product.save()
    
    return product

async def register_loss(sku: str, quantity: int, loss_type: MovementType, notes: str, responsible: str) -> Dict[str, Any]:
    product = await get_product_by_sku(sku)
    
    if product.stock_current < quantity:
        raise InsufficientStockException(sku, product.stock_current, quantity)
        
    movement = StockMovement(
        product_sku=sku,
        quantity=quantity,
        movement_type=loss_type,
        reference_document=f"LOSS-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        notes=notes,
        responsible=responsible,
        unit_cost=product.cost,
        date=datetime.now()
    )
    await movement.insert()
    
    product.stock_current -= quantity
    await product.save()
    
    return {
        "message": "Loss registered successfully",
        "product": product.sku,
        "quantity": quantity,
        "new_stock": product.stock_current,
        "cost_impact": round(product.cost * quantity, 3)
    }

async def get_losses_report(start_date: str = None, end_date: str = None, loss_type: str = None) -> Dict[str, Any]:
    query = {}
    
    if loss_type:
        query["movement_type"] = loss_type
    else:
        query["movement_type"] = {
            "$in": [
                "LOSS_DAMAGED", "LOSS_DEFECTIVE", "LOSS_HUMIDITY",
                "LOSS_EXPIRED", "LOSS_THEFT", "LOSS_OTHER"
            ]
        }
    
    if start_date or end_date:
        query["date"] = {}
        if start_date:
            query["date"]["$gte"] = datetime.fromisoformat(start_date)
        if end_date:
            query["date"]["$lte"] = datetime.fromisoformat(end_date)
            
    movements = await StockMovement.find(query).to_list()
    
    total_quantity = sum(m.quantity for m in movements)
    total_cost = sum(m.quantity * (m.unit_cost or 0) for m in movements)
    
    by_type = {}
    for m in movements:
        if m.movement_type not in by_type:
            by_type[m.movement_type] = {"quantity": 0, "cost": 0, "count": 0}
        by_type[m.movement_type]["quantity"] += m.quantity
        by_type[m.movement_type]["cost"] += m.quantity * (m.unit_cost or 0)
        by_type[m.movement_type]["count"] += 1
        
    return {
        "summary": {
            "total_quantity": total_quantity,
            "total_cost": round(total_cost, 3),
            "total_movements": len(movements)
        },
        "by_type": by_type,
        "movements": movements
    }

async def create_warehouse(warehouse_data: Warehouse) -> Warehouse:
    existing = await Warehouse.find_one(Warehouse.code == warehouse_data.code)
    if existing:
        raise DuplicateEntityException("Warehouse", "code", warehouse_data.code)
    
    await warehouse_data.insert()
    return warehouse_data

async def update_warehouse(code: str, update_data: Warehouse) -> Warehouse:
    warehouse = await Warehouse.find_one(Warehouse.code == code)
    if not warehouse:
        raise NotFoundException("Warehouse", code)
    
    warehouse.name = update_data.name
    warehouse.address = update_data.address
    warehouse.is_active = update_data.is_active
    # Code is immutable usually, or complex to change due to FKs
    
    await warehouse.save()
    return warehouse

async def delete_warehouse(code: str) -> bool:
    warehouse = await Warehouse.find_one(Warehouse.code == code)
    if not warehouse:
        raise NotFoundException("Warehouse", code)
        
    # Validation: Check usage in Stock Movements
    # We check if this warehouse has been used as source or target
    movements_count = await StockMovement.find(
        {"$or": [{"warehouse_id": code}, {"target_warehouse_id": code}]}
    ).count()
    
    if movements_count > 0:
        raise ValidationException(f"Cannot delete warehouse {code} because it has {movements_count} associated stock movements.")
        
    await warehouse.delete()
    return True

async def get_warehouses() -> List[Warehouse]:
    return await Warehouse.find(Warehouse.is_active == True).to_list()

async def register_transfer_out(target_warehouse_id: str, items: List[Dict[str, Any]], notes: str = None) -> Dict[str, Any]:
    target_warehouse = await Warehouse.find_one({"code": target_warehouse_id})
    if not target_warehouse:
        raise NotFoundException("Warehouse", target_warehouse_id)
        
    ref_id = f"GUIA-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    transferred_items = []
    total_cost = 0
    
    for item in items:
        sku = item['sku']
        quantity = item['quantity']
        
        product = await get_product_by_sku(sku)
        
        if product.stock_current < quantity:
            raise InsufficientStockException(sku, product.stock_current, quantity)
            
        # Dynamic Source: Find Main Warehouse
        source_warehouse = await Warehouse.find_one(Warehouse.is_main == True)
        source_id = source_warehouse.code if source_warehouse else "UNKNOWN"

        movement = StockMovement(
            product_sku=sku,
            quantity=quantity,
            movement_type=MovementType.TRANSFER_OUT,
            warehouse_id=source_id,
            target_warehouse_id=target_warehouse.code,
            reference_document=ref_id,
            unit_cost=product.cost,
            notes=notes,
            date=datetime.now()
        )
        await movement.insert()
        
        product.stock_current -= quantity
        await product.save()
        
        transferred_items.append({
            "sku": product.sku,
            "name": product.name,
            "quantity": quantity
        })
        total_cost += quantity * product.cost
        
    return {
        "message": "Transfer registered successfully",
        "guide_number": ref_id,
        "target_warehouse": target_warehouse.name,
        "items_count": len(transferred_items),
        "total_cost": round(total_cost, 3)
    }

async def calculate_weighted_average_cost(product: Product, new_quantity: int, new_unit_cost: float) -> float:
    """
    Calcula el nuevo costo promedio ponderado.
    Fórmula: (valor_stock_actual + valor_nuevo_lote) / (cantidad_actual + cantidad_nueva)
    """
    current_value = product.stock_current * product.cost
    new_value = new_quantity * new_unit_cost
    total_value = current_value + new_value
    total_quantity = product.stock_current + new_quantity
    
    if total_quantity > 0:
        return round(total_value / total_quantity, 3)
    return product.cost

async def register_movement(
    sku: str, 
    quantity: int, 
    movement_type: MovementType, 
    reference: str,
    unit_cost: Optional[float] = None
) -> StockMovement:
    """
    Registra un movimiento de inventario y actualiza el stock del producto.
    Si es una entrada (IN) con unit_cost, recalcula el costo promedio ponderado.
    """
    product = await get_product_by_sku(sku)

    # Si es entrada con costo, calcular nuevo costo promedio
    if movement_type == MovementType.IN and unit_cost is not None:
        new_average_cost = await calculate_weighted_average_cost(product, quantity, unit_cost)
        product.cost = new_average_cost

    # Crear registro de movimiento (Kardex)
    movement = StockMovement(
        product_sku=sku,
        quantity=quantity,
        movement_type=movement_type,
        unit_cost=unit_cost or product.cost,
        reference_document=reference,
        date=datetime.now()
    )
    await movement.insert()

    # Actualizar stock actual
    if movement_type == MovementType.IN:
        product.stock_current += quantity
    elif movement_type == MovementType.OUT:
        if product.stock_current < quantity:
            raise InsufficientStockException(sku, product.stock_current, quantity)
        product.stock_current -= quantity
    
    await product.save()
    return movement

async def check_stock_availability(items: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Verifica la disponibilidad de stock para una lista de ítems.
    Considera el stock reservado en órdenes PENDIENTES.
    Retorna un reporte con ítems disponibles y faltantes.
    """
    # Import locally to avoid circular dependency
    from app.models.sales import SalesOrder, OrderStatus
    
    available_items = []
    missing_items = []
    
    # 1. Calculate Committed Stock (Pending Orders)
    # This is expensive if many orders, but necessary for accuracy.
    # aggregate might be better but finding all pending is simplest start.
    pending_orders = await SalesOrder.find(SalesOrder.status == OrderStatus.PENDING).to_list()
    committed_stock = {} # SKU -> Qty
    
    for order in pending_orders:
        for item in order.items:
            committed_stock[item.product_sku] = committed_stock.get(item.product_sku, 0) + item.quantity
            
    print(f"DEBUG CHECK STOCK ITEMS: {items}")
    print(f"DEBUG COMMITTED STOCK: {committed_stock}")

    for item in items:
        sku = item.get("product_sku")
        required_qty = float(item.get("quantity", 0))
        
        product = await Product.find_one(Product.sku == sku)
        if not product:
            missing_items.append({
                "product_sku": sku,
                "required_quantity": required_qty,
                "available_quantity": 0,
                "stock_physical": 0,
                "stock_committed": 0,
                "missing_quantity": required_qty,
                "product_name": "Product Not Found",
                "unit_price": item.get("unit_price")
            })
            continue
            
        physical_stock = float(product.stock_current)
        committed = float(committed_stock.get(sku, 0))
        available_real = max(0, physical_stock - committed)
        
        # Logic: We can fulfill if available_real >= required_qty
        if available_real >= required_qty:
            available_items.append({
                "product_sku": sku,
                "quantity": required_qty,
                "unit_price": item.get("unit_price"),
                "stock_info": {
                    "physical": physical_stock,
                    "committed": committed,
                    "available": available_real
                }
            })
        else:
            # Stock parcial o nulo
            if available_real > 0:
                # Agregar la parte disponible
                available_items.append({
                    "product_sku": sku,
                    "quantity": available_real,
                    "unit_price": item.get("unit_price"),
                    "stock_info": {
                        "physical": physical_stock,
                        "committed": committed,
                        "available": available_real
                    }
                })
                # Agregar la diferencia a missing
                missing_items.append({
                    "product_sku": sku,
                    "required_quantity": required_qty,
                    "available_quantity": available_real,
                    "stock_physical": physical_stock,
                    "stock_committed": committed,
                    "missing_quantity": required_qty - available_real,
                    "product_name": product.name,
                    "unit_price": item.get("unit_price")
                })
            else:
                # Todo faltante
                missing_items.append({
                    "product_sku": sku,
                    "required_quantity": required_qty,
                    "available_quantity": 0,
                    "stock_physical": physical_stock,
                    "stock_committed": committed,
                    "missing_quantity": required_qty,
                    "product_name": product.name,
                    "unit_price": item.get("unit_price")
                })
                
    return {
        "available_items": available_items,
        "missing_items": missing_items,
        "can_fulfill_full": len(missing_items) == 0
    }
