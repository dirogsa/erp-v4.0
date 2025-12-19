import csv
import io
import json
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
        
        output = io.StringIO()
        writer = None
        
        for record in records:
            data = record.model_dump()
            
            # Extract items if they exist
            items = data.pop(items_field, []) if items_field else [None]
            
            # Flatten parent data
            flattened_parent = cls._flatten_dict(data)
            
            for item in items:
                row = {"operation": "UPDATE"}
                row.update(flattened_parent)
                
                if item:
                    flattened_item = cls._flatten_dict(item, prefix="item_")
                    row.update(flattened_item)
                
                if not writer:
                    writer = csv.DictWriter(output, fieldnames=row.keys())
                    writer.writeheader()
                
                # Convert dates/enums to strings
                row = {k: cls._serialize_val(v) for k, v in row.items()}
                writer.writerow(row)
        
        return output.getvalue()

    @classmethod
    async def import_from_csv(cls, entity_name: str, csv_content: str) -> Dict[str, Any]:
        if entity_name not in cls.ENTITY_REGISTRY:
            raise ValueError(f"Entity {entity_name} not supported for import")

        config = cls.ENTITY_REGISTRY[entity_name]
        model: Type[Document] = config["model"]
        parent_key = config["key"]
        items_field = config["items_field"]
        
        reader = csv.DictReader(io.StringIO(csv_content))
        
        # Group rows by parent key (complex entities) or process individually
        grouped_data: Dict[str, List[Dict[str, Any]]] = {}
        processed_count = 0
        errors = []

        for row_idx, row in enumerate(reader, start=2):
            pk = row.get(parent_key)
            if not pk:
                errors.append(f"Fila {row_idx}: Falta clave principal '{parent_key}'")
                continue
            
            if pk not in grouped_data:
                grouped_data[pk] = []
            grouped_data[pk].append(row)

        success_count = 0
        for pk, rows in grouped_data.items():
            try:
                first_row = rows[0]
                operation = first_row.get("operation", "INSERT").upper()
                
                # Reconstruct document
                doc_data = cls._reconstruct_parent(first_row, items_field)
                
                if items_field:
                    doc_data[items_field] = [cls._reconstruct_item(r) for r in rows if r.get("item_product_sku") or r.get("item_sku")]

                if operation == "DELETE":
                    existing = await model.find_one({parent_key: pk})
                    if existing:
                        await existing.delete()
                        success_count += 1
                else:
                    existing = await model.find_one({parent_key: pk})
                    if existing:
                        # Update
                        await existing.update({"$set": doc_data})
                    else:
                        # Insert
                        new_doc = model(**doc_data)
                        await new_doc.insert()
                    success_count += 1
                    
            except Exception as e:
                errors.append(f"Error procesando {pk}: {str(e)}")

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
