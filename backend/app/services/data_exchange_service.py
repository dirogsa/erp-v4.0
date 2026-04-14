import csv
import io
import json
import sys
from typing import List, Dict, Any, Type, Optional
from datetime import datetime
from beanie import Document
from pydantic import BaseModel
from app.models.inventory import Product, Warehouse, DeliveryGuide
from app.models.sales import SalesQuote, SalesOrder, SalesInvoice, SalesNote, Customer
from app.models.purchasing import PurchaseQuote, PurchaseOrder, PurchaseInvoice, Supplier

class DataExchangeService:
    # Service Registry: Maps entity names to Models and their unique keys
    ENTITY_REGISTRY = {
        "products": {"model": Product, "key": "sku", "items_field": None},
        "warehouses": {"model": Warehouse, "key": "code", "items_field": None},
        "customers": {"model": Customer, "key": "ruc", "items_field": None},
        "suppliers": {"model": Supplier, "key": "name", "items_field": None},
        "sales_quotes": {"model": SalesQuote, "key": "quote_number", "items_field": "items"},
        "sales_orders": {"model": SalesOrder, "key": "order_number", "items_field": "items"},
        "sales_invoices": {"model": SalesInvoice, "key": "invoice_number", "items_field": "items"},
        "sales_notes": {"model": SalesNote, "key": "note_number", "items_field": "items"},
        "purchase_quotes": {"model": PurchaseQuote, "key": "quote_number", "items_field": "items"},
        "purchase_orders": {"model": PurchaseOrder, "key": "order_number", "items_field": "items"},
        "purchase_invoices": {"model": PurchaseInvoice, "key": "invoice_number", "items_field": "items"},
        "delivery_guides": {"model": DeliveryGuide, "key": "guide_number", "items_field": "items"},
    }

    @classmethod
    async def export_to_csv(cls, entity_name: str) -> str:
        if entity_name not in cls.ENTITY_REGISTRY:
            raise ValueError(f"Entity {entity_name} not supported for export")

        config = cls.ENTITY_REGISTRY[entity_name]
        model: Type[Document] = config["model"]
        items_field = config["items_field"]
        
        # Fetch all records
        records = await model.find_all().to_list()
        
        if not records:
            return ""

        # Prepare data rows first to collect all possible fieldnames
        rows = []
        all_fieldnames = set()
        
        for record in records:
            data = record.model_dump()
            # Forzamos la extracción del ID primario de Mongo a nivel de fila maestra
            if hasattr(record, "id"):
                data["id"] = str(record.id)
                
            items = data.pop(items_field, []) if items_field else [None]
            flattened_parent = cls._flatten_dict(data)
            
            for item in items:
                # El sistema ahora designa si es nuevo (sin id) o existente (con id)
                row = {"operation": "UPDATE" if data.get("id") else "INSERT"}
                row.update(flattened_parent)
                
                if item:
                    flattened_item = cls._flatten_dict(item, prefix="item_")
                    row.update(flattened_item)
                
                all_fieldnames.update(row.keys())
                rows.append({k: cls._serialize_val(v) for k, v in row.items()})

        output = io.StringIO()
        # Sort fieldnames: put operation, id and natural key first
        sorted_fields = sorted(list(all_fieldnames))
        if "operation" in sorted_fields:
            sorted_fields.insert(0, sorted_fields.pop(sorted_fields.index("operation")))
        if "id" in sorted_fields:
            sorted_fields.insert(1, sorted_fields.pop(sorted_fields.index("id")))
        if config["key"] in sorted_fields:
            sorted_fields.insert(2, sorted_fields.pop(sorted_fields.index(config["key"])))

        writer = csv.DictWriter(output, fieldnames=sorted_fields)
        writer.writeheader()
        writer.writerows(rows)
        
        return output.getvalue()

    @classmethod
    async def import_from_csv(cls, entity_name: str, csv_content: str) -> Dict[str, Any]:
        if entity_name not in cls.ENTITY_REGISTRY:
            raise ValueError(f"Entity {entity_name} not supported for import")

        config = cls.ENTITY_REGISTRY[entity_name]
        model: Type[Document] = config["model"]
        parent_key = config["key"]
        items_field = config["items_field"]
        
        # Aumentar el límite de tamaño de campo para evitar errores con JSONs o textos largos
        csv.field_size_limit(sys.maxsize)
        
        reader = csv.DictReader(io.StringIO(csv_content))
        
        # Group rows by ID (if exists for updates) or by natural_key (for pure inserts of complex objects)
        grouped_data: Dict[str, Dict[str, Any]] = {}
        processed_count = 0
        errors = []

        for row_idx, row in enumerate(reader, start=2):
            doc_id = row.get("id")
            natural_key_val = row.get(parent_key)
            
            # El ID universal manda. Si no hay ID, agrupamos por llave natural temporalmente para crearlo.
            group_key = doc_id if (doc_id and doc_id.strip()) else natural_key_val
            
            if not group_key:
                errors.append(f"Fila {row_idx}: Falta columna 'id' o '{parent_key}' para agrupar.")
                continue
            
            if group_key not in grouped_data:
                grouped_data[group_key] = {"id": doc_id, "natural_key_val": natural_key_val, "rows": []}
            grouped_data[group_key]["rows"].append(row)

        success_count = 0
        from beanie import PydanticObjectId
        
        for group_key, group in grouped_data.items():
            doc_id = group["id"]
            natural_key_val = group["natural_key_val"]
            rows = group["rows"]
            
            try:
                first_row = rows[0]
                operation = first_row.get("operation")
                if not operation: 
                    operation = "UPDATE" if doc_id else "INSERT"
                operation = operation.upper()
                
                # Reconstruct document
                doc_data = cls._reconstruct_parent(first_row, items_field)
                
                if items_field:
                    doc_data[items_field] = [cls._reconstruct_item(r) for r in rows if r.get("item_product_sku") or r.get("item_sku") or r.get("item_product_id")]

                if doc_id:
                    # === FLUJO UPDATE/DELETE BASADO ABSOLUTAMENTE EN SYSTEM_ID ===
                    try:
                        existing = await model.get(PydanticObjectId(doc_id))
                    except:
                        existing = None

                    if operation == "DELETE" and existing:
                        await existing.delete()
                        success_count += 1
                        continue

                    if existing:
                        await existing.update({"$set": doc_data})
                        success_count += 1
                    else:
                        errors.append(f"Registro con ID {doc_id} no encontrado para {operation}.")
                else:
                    # === FLUJO INSERT PURO ===
                    if operation == "DELETE":
                        # Legacy fallback
                        existing = await model.find_one({parent_key: natural_key_val})
                        if existing: await existing.delete()
                        success_count += 1
                        continue
                        
                    # Insertar (MongoDB defenderá índices duplicados automáticamente lanzando excepcion)
                    new_doc = model(**doc_data)
                    await new_doc.insert()
                    success_count += 1
                    
            except Exception as e:
                errors.append(f"Error procesando grupo {group_key}: {str(e)}")

        return {
            "summary": {
                "total": len(grouped_data),
                "success": success_count,
                "errors": len(errors)
            },
            "details": {"errors": errors}
        }

    @staticmethod
    def _flatten_dict(d: Dict[str, Any], prefix: str = "") -> Dict[str, Any]:
        items = {}
        for k, v in d.items():
            new_key = f"{prefix}{k}"
            if isinstance(v, dict):
                # Only simple dicts or skip complex ones for now
                if "_id" in v: continue # skip beanie metadata
                items.update(DataExchangeService._flatten_dict(v, f"{new_key}_"))
            else:
                items[new_key] = v
        return items

    @staticmethod
    def _reconstruct_parent(row: Dict[str, Any], items_field: str) -> Dict[str, Any]:
        """Reconstruction with JSON support for complex fields"""
        parent = {}
        for k, v in row.items():
            if k == "operation" or k.startswith("item_") or k == "_id" or k == "id":
                continue
            
            # Support for JSON-serialized lists/dicts in columns (specs, equivalences, etc.)
            if v and isinstance(v, str) and (v.startswith('[') or v.startswith('{')):
                try:
                    parent[k] = json.loads(v)
                    continue
                except:
                    pass

            parent[k] = v if v != "" else None
        return parent

    @staticmethod
    def _reconstruct_item(row: Dict[str, Any]) -> Dict[str, Any]:
        item = {}
        for k, v in row.items():
            if k.startswith("item_"):
                new_key = k.replace("item_", "", 1)
                item[new_key] = v
        return item

    @staticmethod
    def _serialize_val(val: Any) -> Any:
        if isinstance(val, datetime):
            return val.isoformat()
        if hasattr(val, "value"): # Enums
            return val.value
        if isinstance(val, (list, dict)):
            return json.dumps(val)
        return val
