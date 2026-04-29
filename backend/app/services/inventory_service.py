import re
import asyncio
import logging
from app.models.inventory import Product, MovementType, ProductType, StockMovement, Warehouse, DeliveryGuide, GuideItem, GuideType, GuideStatus, CompanyProductData, ProductBrand, ProductCategory
from app.utils.norm_utils import normalize_sku
from beanie import PydanticObjectId
from pymongo.operations import ReplaceOne
from app.models.auth import User
from app.services.audit_service import AuditService
from app.services.brand_service import ensure_brands_exist
from app.services.catalog_service import perform_catalog_lookup
from app.exceptions.business_exceptions import NotFoundException, ValidationException, InsufficientStockException, DuplicateEntityException

logger = logging.getLogger(__name__)

def populate_company_data(product: Product, company_id: Optional[str]):
    """Inyecta metadatos específicos (auditoría) pero mantiene stock y precio globales"""
    if not company_id:
        return product
    
    # Mantener el objeto product como la fuente de verdad global
    # Los metadatos de auditoría pueden ser útiles para ver la última vez 
    # que ESTA empresa vendió el producto, pero el stock y precio son únicos.
    return product

async def external_lookup(sku: str) -> str:
    """
    Busca un producto en catálogos externos delegando al servicio de catálogos.
    """
    return await perform_catalog_lookup(sku)

async def generate_marketing_sku() -> str:
    now = datetime.now()
    prefix = f"PUB-{now.strftime('%y%m')}-"
    
    # Find products that start with this prefix, sorted by SKU descending
    # We use regex to find matching SKUs
    pattern = re.compile(f"^{prefix}\\d{{4}}$")
    products = await Product.find({"sku": {"$regex": f"^{prefix}"}, "company_id": company_id}).to_list()
    
    max_num = 0
    for p in products:
        try:
            # Extract the last 4 digits
            num_part = p.sku.split('-')[-1]
            num = int(num_part)
            if num > max_num:
                max_num = num
        except (ValueError, IndexError):
            continue
            
    next_num = max_num + 1
    return f"{prefix}{next_num:04d}"

from app.schemas.common import PaginatedResponse

async def get_products(
    skip: int = 0, 
    limit: int = 50, 
    search: Optional[str] = None, 
    category: Optional[str] = None,
    redeemable_only: Optional[bool] = None,
    product_type: Optional[str] = None,
    company_id: Optional[str] = None
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

        if payload.only_with_price:
            mongo_filter["price_list"] = {"$gt": 0}

    if product_type:
        query["type"] = product_type
        
    total = await Product.find(query).count()
    items = await Product.find(query).sort('sku').skip(skip).limit(limit).to_list()
    
    # Inyectar datos específicos de la empresa
    for item in items:
        populate_company_data(item, company_id)
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=skip // limit + 1,
        pages=(total + limit - 1) // limit,
        size=limit
    )

async def find_product_robustly(sku: str, brand: Optional[str] = None, company_id: Optional[str] = None) -> Optional[Product]:
    """
    Buscador de grado industrial con inteligencia de marca y normalización.
    Ahora opera sobre el catálogo global e inyecta datos de la empresa solicitante.
    """
    if not sku: return None
    
    sku_clean = normalize_sku(sku)
    brand_upper = brand.upper().strip() if brand else None

    # 1. Búsqueda Directa (SKU + Marca) - MÁXIMA PRIORIDAD
    if brand_upper:
        query = {"sku": sku_clean, "brand": brand_upper}
        product = await Product.find_one(query)
        if product: return populate_company_data(product, company_id)

    # 2. Búsqueda por SKU (Cualquier Marca)
    product = await Product.find_one({"sku": sku_clean})
    if product: return populate_company_data(product, company_id)

    # 3. Búsqueda en Equivalencias / Cruces
    product = await Product.find_one({"equivalences.code": sku_clean})
    if product: return populate_company_data(product, company_id)

    # 4. Caso SUNAT (DESACTIVADO): Se eliminó para evitar que el sistema ignore sufijos importantes (Ej: 'WA9432 F' ya no coincidirá con 'WA9432')
    # Si el usuario quiere buscar por palabra, debe usar el buscador inteligente de la UI, no la carga de stock/precios.

    # 5. AUTO-CREACIÓN DE GENÉRICOS (Ahora Globales)
    generic_skus = ['VARIOS-GENERICO', 'VARIOS-ACEITES', 'VARIOS-BUJIAS', 'VARIOS-BATERIAS', 'VARIOS-REFRIGERANTES', 'GENERICO']
    sku_upper = sku.upper()
    if any(g in sku_upper for g in generic_skus):
        p_type = ProductType.MISC
        if 'ACEITE' in sku_upper: p_type = ProductType.LUBRICANT
        elif 'BUJIA' in sku_upper: p_type = ProductType.SPARK_PLUG
        elif 'BATERIA' in sku_upper: p_type = ProductType.BATTERY
        elif 'REFRIGERANTE' in sku_upper: p_type = ProductType.COOLANT
        
        generic = Product(
            sku=sku_upper,
            name=f"PRODUCTO GENERICO ({sku_upper})",
            brand="GENERICO",
            type=p_type,
            is_active_in_shop=False,
            category_name="Varios"
        )
        await generic.insert()
        return populate_company_data(generic, company_id)

    return None

async def get_product_by_sku(sku: str) -> Product:
    product = await find_product_robustly(sku)
    if not product:
        raise NotFoundException("Product", sku)
    return product

async def resolve_category_id(name_alias: str) -> Optional[str]:
    """
    Solución Profesional: Mapeador Universal de Categorías.
    Resuelve aliases de diferentes catálogos a una categoría única del ERP usando la Base de Datos en Tiempo Real.
    """
    if not name_alias: return None
    
    alias = name_alias.upper().strip()
    
    # 1. Búsqueda exacta por Nombre
    category = await ProductCategory.find_one({"name": {"$regex": f"^{alias}$", "$options": "i"}})
    if category:
        return str(category.id)
        
    # 2. Búsqueda dentro del nuevo arreglo de Aliases de Importación
    # Como los usuarios pueden escribir mayúsculas/minúsculas, usamos una búsqueda regex sobre el array
    categories = await ProductCategory.find_all().to_list()
    for cat in categories:
        if cat.import_aliases:
            # Normalizamos los aliases de la DB para comparar
            db_aliases = [a.strip().upper() for a in cat.import_aliases]
            if alias in db_aliases:
                return str(cat.id)
                
    return None

async def create_product(product_data: Product, initial_stock: int = 0, user: Optional[User] = None, company_id: Optional[str] = None):
    # Normalizar SKU y Marca antes de operar
    product_data.sku = normalize_sku(product_data.sku)
    product_data.brand = product_data.brand.upper().strip()

    # Normalizar códigos de equivalencia
    if product_data.equivalences:
        for eq in product_data.equivalences:
            eq.code = normalize_sku(eq.code)

    # Verificar si el SKU y la Marca ya existen globalmente
    existing = await Product.find_one(Product.sku == product_data.sku, Product.brand == product_data.brand)
    
    if existing:
        raise DuplicateEntityException(f"Producto con SKU {product_data.sku} y marca {product_data.brand} ya existe en el catálogo maestro.")
    
    # Asegurar que las marcas vehiculares existan si vienen en aplicaciones
    if product_data.applications:
        brands = set(app.make.upper() for app in product_data.applications if app.make)
        if brands:
            await ensure_brands_exist(list(brands))

    # Blindaje: Productos comerciales no pueden tener precio en puntos
    if product_data.type == ProductType.COMMERCIAL:
        product_data.points_cost = 0

    # Guardar producto global
    await product_data.insert()

    # Si hay stock inicial, registrar movimiento en la bolsa de la empresa
    if initial_stock > 0 and company_id:
        await register_movement(
            sku=product_data.sku,
            quantity=initial_stock,
            movement_type=MovementType.IN,
            reference=f"INITIAL-{product_data.sku}",
            company_id=company_id
        )

    if user:
        await AuditService.log_action(
            user=user,
            action="CREATE",
            module="INVENTORY",
            description=f"Se creó el producto global {product_data.sku} - {product_data.name} con stock inicial {initial_stock} para {company_id}",
            entity_id=str(product_data.id),
            entity_name=product_data.sku
        )

    return populate_company_data(product_data, company_id)

async def bulk_create_products(products: List[Product], update_existing: bool = True, user: Optional[User] = None, company_id: Optional[str] = None):
    if not products:
        return {"created": 0, "updated": 0, "skipped": 0, "total": 0}

    # 1. Asegurar que las marcas vehiculares existan (Master Data Consistency)
    all_brands = set()
    for p in products:
        if p.applications:
            for app in p.applications:
                if app.make:
                    all_brands.add(app.make.upper())
    
    if all_brands:
        await ensure_brands_exist(list(all_brands))

    # 2. Pre-procesamiento Masivo
    bulk_ops = []
    created_count = 0
    updated_count = 0
    skipped_count = 0

    # Extraer SKUs y Marcas para búsqueda masiva previa si no queremos sobrescribir todo
    # Pero para un ERP de alto nivel, el Upsert (ReplaceOne) es el estándar de oro.
    
    # 3. Preparar operaciones Bulk
    collection = Product.get_pymongo_collection()
    
    for p_data in products:
        # Normalización "Libro de Texto"
        p_data.sku = normalize_sku(p_data.sku)
        p_data.brand = p_data.brand.upper().strip() if p_data.brand else "GENERICO"
        
        if p_data.equivalences:
            for eq in p_data.equivalences:
                eq.code = normalize_sku(eq.code)
        
        # Resolver categoría (Podría optimizarse más con una caché, pero solve_category_id ya usa regex)
        if p_data.category_name and not p_data.category_id:
            p_data.category_id = await resolve_category_id(p_data.category_name)

        if p_data.type == ProductType.COMMERCIAL:
            p_data.points_cost = 0

        # En Beanie/Motor, convertimos el modelo a dict para pymongo
        # Excluimos el ID si es nuevo para que Mongo genere uno, o lo mantenemos si queremos UPSERT exacto.
        product_dict = p_data.model_dump(exclude={"id"})
        
        # Operación Atómica: Buscar por SKU + Marca y Reemplazar/Insertar
        # Esto es lo que garantiza escalabilidad para 2000+ items
        bulk_ops.append(
            ReplaceOne(
                {"sku": p_data.sku, "brand": p_data.brand},
                product_dict,
                upsert=update_existing
            )
        )

    # 4. Ejecución Masiva en un solo Round-trip
    if bulk_ops:
        result = await collection.bulk_write(bulk_ops, ordered=False)
        created_count = result.upserted_count
        updated_count = result.modified_count
        # Nota: En ReplaceOne con upsert, si no existe cuenta como upserted. Si existe y cambia, como modified.
        # Si existe y es IDÉNTICO, modified_count será 0.

    if user:
        action_desc = f"Procesamiento Masivo ERP: {len(products)} ítems (BulkWrite OK)"
        await AuditService.log_action(
            user=user,
            action="BULK_UPSERT",
            module="INVENTORY",
            description=action_desc,
            entity_name=f"{len(products)} productos"
        )

    return {
        "created": created_count,
        "updated": updated_count,
        "total": len(products)
    }

async def update_product(sku: str, update_data: Product, new_stock: int = None, user: Optional[User] = None) -> Product:
    product = await get_product_by_sku(sku)
    
    # Update all editable fields from update_data
    product.name = update_data.name
    product.brand = update_data.brand
    product.description = update_data.description
    product.image_url = update_data.image_url
    product.weight_g = update_data.weight_g
    product.type = update_data.type
    
    # Category & Attributes
    product.category_id = update_data.category_id
    product.custom_attributes = update_data.custom_attributes
    product.features = update_data.features
    
    # Pricing
    product.price_list = update_data.price_list
    product.cost = update_data.cost
    product.loyalty_points = update_data.loyalty_points
    product.points_cost = update_data.points_cost
    
    # Technical data
    product.specs = update_data.specs
    product.equivalences = update_data.equivalences
    product.applications = update_data.applications
    
    # Shop visibility flags
    product.is_new = update_data.is_new
    product.is_active_in_shop = update_data.is_active_in_shop
    
    # Blindaje: Productos comerciales no pueden tener precio en puntos
    if product.type == ProductType.COMMERCIAL:
        product.points_cost = 0
    
    await product.save()
    
    if user:
        await AuditService.log_action(
            user=user,
            action="UPDATE",
            module="INVENTORY",
            description=f"Se actualizó la información del producto {sku}",
            entity_id=str(product.id),
            entity_name=sku
        )
    
    # Auto-register/sync vehicle brands from applications
    if product.applications:
        await ensure_brands_exist([app.make for app in product.applications])
    
    if new_stock is not None and new_stock != product.stock_current:
        product = await adjust_stock(sku, new_stock, "Ajuste desde edición de producto", company_id=update_data.company_id)
        
    return product

async def delete_product(sku: str, user: Optional[User] = None) -> bool:
    product = await Product.find_one(Product.sku == sku)
    if not product:
        raise NotFoundException("Product", sku)
    if user:
        await AuditService.log_action(
            user=user,
            action="DELETE",
            module="INVENTORY",
            description=f"Se eliminó permanentemente el producto {sku} - {product.name}",
            entity_id=str(product.id),
            entity_name=sku
        )

    await product.delete()
    return True

async def adjust_stock(sku: str, new_quantity: int, notes: str, movement_type: Any = None, company_id: Optional[str] = None) -> Any:
    if movement_type is None:
        movement_type = MovementType.ADJUSTMENT
    product = await get_product_by_sku(sku)
    
    diff = new_quantity - product.stock_current
    if diff == 0:
        return product
        
    actual_type = MovementType.IN if diff > 0 else MovementType.OUT
    
    await register_movement(
        sku=sku,
        quantity=abs(diff),
        movement_type=actual_type,
        reference=f"ADJUST-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        notes=notes,
        company_id=company_id, # La empresa que hace el ajuste
        product_id=product.id
    )
    
    product.stock_current = new_quantity
    await product.save()
    
    return product

async def register_loss(sku: str, quantity: int, loss_type: Any, notes: str, responsible: str, company_id: Optional[str] = None) -> Dict[str, Any]:
    product = await get_product_by_sku(sku)
    
    await register_movement(
        sku=sku,
        quantity=quantity,
        movement_type=MovementType.OUT, # Las mermas son salidas
        reference=f"LOSS-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        notes=f"{loss_type}: {notes} (Resp: {responsible})",
        company_id=company_id,
        product_id=product.id
    )
    
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

async def create_warehouse(warehouse_data: Any) -> Any:
    existing = await Warehouse.find_one(Warehouse.code == warehouse_data.code)
    if existing:
        raise DuplicateEntityException("Warehouse", "code", warehouse_data.code)
    
    await warehouse_data.insert()
    return warehouse_data

async def update_warehouse(code: str, update_data: Any) -> Any:
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

async def get_warehouses(company_id: Optional[str] = None) -> List[Any]:
    if company_id:
        return await Warehouse.find(
            {"$or": [
                {"company_id": company_id},
                {"allowed_companies": company_id}
            ], "is_active": True}
        ).to_list()
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
            product_id=str(product.id) if product else None,
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
            "product_id": str(product.id) if product else None,
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
    Calcula el nuevo costo promedio ponderado GLOBAL del almacén.
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
    movement_type: Any, 
    reference: str,
    unit_cost: Optional[float] = None,
    date: Optional[datetime] = None,
    product_id: Optional[str] = None,
    company_id: Optional[str] = None,
    legal_owner_id: Optional[str] = None
) -> Any:
    """
    Registra un movimiento de inventario y actualiza el stock del producto.
    Si es una entrada (IN) con unit_cost, recalcula el costo promedio ponderado.
    """
    if product_id:
        from beanie import PydanticObjectId
        product = await Product.get(PydanticObjectId(product_id))
        if not product: raise NotFoundException("Product", product_id)
    else:
        # Importante: buscar sin company_id para obtener el catálogo global
        product = await find_product_robustly(sku)
        if not product: raise NotFoundException("Product", sku)

    # El dueño legal por defecto es quien realiza el movimiento, 
    # a menos que sea una venta cruzada (Inter-company)
    actual_owner_id = legal_owner_id or company_id

    # Asegurar que existan los buckets de stock
    if company_id not in product.company_data:
        product.company_data[company_id] = CompanyProductData()
    if actual_owner_id not in product.company_data:
        product.company_data[actual_owner_id] = CompanyProductData()

    comp_data = product.company_data[company_id]
    owner_data = product.company_data[actual_owner_id]

    # 1. Si es entrada con costo, recalcular costo promedio GLOBAL
    if movement_type == MovementType.IN and unit_cost is not None:
        new_cost = await calculate_weighted_average_cost(product, quantity, unit_cost)
        product.cost = new_cost

    # 2. Registrar el movimiento en el Kardex
    movement = StockMovement(
        product_id=product.id,
        sku=sku,
        quantity=quantity,
        movement_type=movement_type,
        unit_cost=unit_cost or product.cost,
        reference_id=reference,
        reference_type="DIRECT" if "ADJUST" in reference else "SALES_INVOICE",
        company_id=company_id,
        legal_owner_id=actual_owner_id,
        date=date or datetime.utcnow(),
        warehouse_id="MAIN"
    )
    await movement.insert()

    # 3. Actualizar metadatos de auditoría por empresa
    if company_id not in product.company_data:
        product.company_data[company_id] = CompanyProductData()
    
    comp_metadata = product.company_data[company_id]
    if movement_type == MovementType.IN:
        comp_metadata.last_purchase_date = date or datetime.utcnow()
    elif movement_type == MovementType.OUT:
        comp_metadata.last_sale_date = date or datetime.utcnow()

    # 4. Actualizar stock GLOBAL
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
        product_id = item.get("product_id")
        required_qty = float(item.get("quantity", 0))
        
        if product_id:
            from beanie import PydanticObjectId
            product = await Product.get(PydanticObjectId(product_id))
        else:
            product = await find_product_robustly(sku)
        
        # Use found product's SKU for committed stock if available
        lookup_sku = product.sku if product else sku
        committed = float(committed_stock.get(lookup_sku, 0))

        if not product:
            missing_items.append({
                "product_sku": sku,
                "required_quantity": required_qty,
                "available_quantity": 0,
                "stock_physical": 0,
                "stock_committed": committed,
                "missing_quantity": required_qty,
                "product_name": "Producto No Encontrado",
                "unit_price": item.get("unit_price")
            })
            continue
        
        product_name = product.name
        physical_stock = float(product.stock_current)
        available_real = max(0, physical_stock - committed)
        
        # Logic: We can fulfill if available_real >= required_qty
        if available_real >= required_qty:
            available_items.append({
                "product_sku": sku,
                "product_name": product_name,
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

async def bulk_reconcile(adjustments: List[Dict[str, Any]], user: User) -> Dict[str, Any]:
    """
    Procesa una lista de ajustes de inventario masivos.
    adjustments: [{"sku": "...", "physical_stock": 10, "reason": "...", "responsible": "...", "notes": "..."}]
    """
    results = []
    total_impact = 0
    ref_id = f"RECON-{datetime.now().strftime('%Y%m%d%H%M%S')}"

    for adj in adjustments:
        sku = adj.get("sku")
        physical_stock = int(adj.get("physical_stock", 0))
        reason = adj.get("reason", MovementType.ADJUSTMENT_STOCKTAKE)
        notes = adj.get("notes", "Ajuste masivo por inventario físico")
        responsible = adj.get("responsible", user.username)

        product = await get_product_by_sku(sku)
        system_stock = product.stock_current
        diff = physical_stock - system_stock

        if diff == 0:
            continue

        # Registrar el movimiento
        # Usamos el costo actual del producto para el impacto financiero
        movement = StockMovement(
            product_id=str(product.id) if product else None,
            product_sku=sku,
            quantity=abs(diff),
            movement_type=reason,
            reference_document=ref_id,
            unit_cost=product.cost,
            notes=notes,
            responsible=responsible,
            date=datetime.now()
        )
        await movement.insert()
        
        # Actualizar stock
        product.stock_current = physical_stock
        await product.save()

        impact = diff * product.cost
        total_impact += impact

        results.append({
            "sku": sku,
            "system_stock": system_stock,
            "physical_stock": physical_stock,
            "delta": diff,
            "impact": round(impact, 3)
        })

    await AuditService.log_action(
        user=user,
        action="BULK_RECONCILE",
        module="INVENTORY",
        description=f"Se realizó una reconciliación masiva de {len(results)} productos. Impacto total: {total_impact}",
        entity_name=ref_id
    )

    return {
        "reference": ref_id,
        "processed_count": len(results),
        "total_impact": round(total_impact, 3),
        "details": results
    }

async def smart_search(query: str) -> Dict[str, Any]:
    """
    Realiza una búsqueda inteligente:
    1. Busca en la base de datos local (SKU, Nombre, Equivalencias, Aplicaciones).
    2. Si no hay resultados de alta confianza, intenta resolver la equivalencia externamente.
    """
    query_clean = query.strip().upper()
    
    # 1. Búsqueda Local
    # Priorizamos coincidencias exactas en SKU o Equivalencias
    local_products = await Product.find({
        "$or": [
            {"sku": query_clean},
            {"equivalences.code": query_clean},
            {"ean": query_clean}
        ]
    }).to_list()
    
    # Si no hay exactos, búsqueda parcial (ya implementada en get_products pero la simplificamos aquí para Smart Search)
    if not local_products:
        local_products = await Product.find({
            "$or": [
                {"name": {"$regex": query_clean, "$options": "i"}},
                {"equivalences.code": {"$regex": query_clean, "$options": "i"}},
                {"sku": {"$regex": query_clean, "$options": "i"}}
            ]
        }).limit(10).to_list()

    # 2. Búsqueda Externa (Resolución de Cruces)
    # Si el query parece un código de marca (no tiene espacios y tiene longitud decente)
    external_data = None
    if len(query_clean) > 3 and not local_products:
        try:
            # Delegar al servicio de catálogo
            from app.services.catalog_service import lookup_cross_references
            external_data = await lookup_cross_references(query_clean)
        except Exception as e:
            logger.error(f"Error resolving external cross-refs for {query_clean}: {e}")

    return {
        "query": query,
        "local_results": local_products,
        "external_results": external_data, # Lista de [{brand, code, internal_equivalent_sku}]
        "timestamp": datetime.now()
    }

# ─────────────────────────────────────────────────────────────────────────────
# MASTER DATA MANAGEMENT (MDM) — Gestión Dinámica de Marcas
# ─────────────────────────────────────────────────────────────────────────────

async def get_brands() -> List[ProductBrand]:
    """Obtiene el catálogo maestro de marcas"""
    return await ProductBrand.find_all().to_list()

async def create_brand(brand: ProductBrand) -> ProductBrand:
    """Registra una nueva marca y actualiza el motor semántico"""
    await brand.insert()
    
    # Sincronizar el motor inteligente de norm_utils
    from app.utils.norm_utils import _refresh_brands_cache
    await _refresh_brands_cache()
    
    return brand

async def update_brand(brand_id: str, brand_data: ProductBrand) -> ProductBrand:
    """Actualiza una marca y sus alias de importación"""
    brand = await ProductBrand.get(PydanticObjectId(brand_id))
    if not brand:
        raise NotFoundException("Brand", brand_id)
    
    brand.name = brand_data.name
    brand.aliases = brand_data.aliases
    brand.description = brand_data.description
    brand.is_active = brand_data.is_active
    await brand.save()
    
    # Sincronizar motor
    from app.utils.norm_utils import _refresh_brands_cache
    await _refresh_brands_cache()
    
    return brand

async def delete_brand(brand_id: str):
    """Elimina una marca del catálogo maestro"""
    brand = await ProductBrand.get(PydanticObjectId(brand_id))
    if not brand:
        raise NotFoundException("Brand", brand_id)
    
    await brand.delete()
    
    # Sincronizar motor
    from app.utils.norm_utils import _refresh_brands_cache
    await _refresh_brands_cache()
