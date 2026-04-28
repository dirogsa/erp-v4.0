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
from app.models.pricing import PriceList, PriceEntry

class DataExchangeService:
    # Service Registry: Maps entity names to Models and their unique keys
    # Service Registry: Maps entity names to Models and their identity keys
    ENTITY_REGISTRY = {
        "products": {"model": Product, "identity_keys": ["sku", "brand"], "items_field": None},
        "warehouses": {"model": Warehouse, "identity_keys": ["code"], "items_field": None},
        "customers": {"model": Customer, "identity_keys": ["ruc"], "items_field": None},
        "suppliers": {"model": Supplier, "identity_keys": ["name"], "items_field": None},
        "sales_quotes": {"model": SalesQuote, "identity_keys": ["quote_number"], "items_field": "items"},
        "sales_orders": {"model": SalesOrder, "identity_keys": ["order_number"], "items_field": "items"},
        "sales_invoices": {"model": SalesInvoice, "identity_keys": ["invoice_number"], "items_field": "items"},
        "sales_notes": {"model": SalesNote, "identity_keys": ["note_number"], "items_field": "items"},
        "purchase_quotes": {"model": PurchaseQuote, "identity_keys": ["quote_number"], "items_field": "items"},
        "purchase_orders": {"model": PurchaseOrder, "identity_keys": ["order_number"], "items_field": "items"},
        "purchase_invoices": {"model": PurchaseInvoice, "identity_keys": ["invoice_number"], "items_field": "items"},
        "delivery_guides": {"model": DeliveryGuide, "identity_keys": ["guide_number"], "items_field": "items"},
        "price_lists": {"model": PriceList, "identity_keys": ["name"], "items_field": None},
        "price_entries": {"model": PriceEntry, "identity_keys": ["sku", "price_list_id", "min_quantity"], "items_field": None},
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
            data.pop("image_gallery", None) # Excluir de la exportación CSV para no contaminar el Excel
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
        # Sort fieldnames: put operation, id and identity keys first
        sorted_fields = sorted(list(all_fieldnames))
        if "operation" in sorted_fields:
            sorted_fields.insert(0, sorted_fields.pop(sorted_fields.index("operation")))
        if "id" in sorted_fields:
            sorted_fields.insert(1, sorted_fields.pop(sorted_fields.index("id")))
        
        # Priorizar llaves de identidad en las primeras columnas
        for i, id_key in enumerate(config["identity_keys"]):
            if id_key in sorted_fields:
                sorted_fields.insert(2 + i, sorted_fields.pop(sorted_fields.index(id_key)))

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
        identity_keys = config["identity_keys"]
        items_field = config["items_field"]
        
        # Aumentar el límite de tamaño de campo para evitar errores con JSONs o textos largos
        csv.field_size_limit(sys.maxsize)
        
        reader = csv.DictReader(io.StringIO(csv_content))
        
        # Group rows by ID (if exists for updates) or by composite natural key
        grouped_data: Dict[str, Dict[str, Any]] = {}
        processed_count = 0
        errors = []

        for row_idx, row in enumerate(reader, start=2):
            doc_id = row.get("id")
            
            # Generar llave natural compuesta
            identity_vals = [row.get(k, "").strip() for k in identity_keys]
            natural_key_val = "|".join(identity_vals)
            
            # El ID universal manda. Si no hay ID, agrupamos por la identidad compuesta.
            group_key = doc_id if (doc_id and doc_id.strip()) else natural_key_val
            
            if not group_key or group_key == "|": # Caso de llaves vacías
                errors.append(f"Fila {row_idx}: Faltan columnas de identidad ({', '.join(identity_keys)}).")
                continue
            
            if group_key not in grouped_data:
                grouped_data[group_key] = {
                    "id": doc_id, 
                    "identity_filter": {k: row.get(k) for k in identity_keys},
                    "rows": []
                }
            grouped_data[group_key]["rows"].append(row)

        success_count = 0
        from beanie import PydanticObjectId
        from pymongo import UpdateOne, InsertOne, DeleteOne
        
        operations = []
        # Para entidades con items (ej: invoices), mantenemos el flujo secuencial por ahora 
        # para preservar la lógica de reconstrucción compleja. 
        # Pero para entidades planas (ej: products, customers), usaremos bulk_write.
        
        use_bulk = items_field is None
        
        if use_bulk:
            collection = model.get_pymongo_collection()
            bulk_ops = []
            
            for group_key, group in grouped_data.items():
                doc_id = group["id"]
                identity_filter = group["identity_filter"]
                first_row = group["rows"][0]
                
                try:
                    operation = first_row.get("operation", "UPDATE" if doc_id else "INSERT").upper()
                    doc_data = cls._reconstruct_parent(first_row, items_field)
                    
                    # Validar tipos con el modelo
                    try:
                        validated_doc = model.model_validate(doc_data)
                        doc_data = validated_doc.model_dump(exclude={"id"}, exclude_none=True)
                    except Exception as ve:
                        errors.append(f"Aviso en {group_key}: Validación falló, se usará data original. {str(ve)}")
                    
                    if doc_id:
                        if operation == "DELETE":
                            bulk_ops.append(DeleteOne({"_id": PydanticObjectId(doc_id)}))
                        else:
                            bulk_ops.append(UpdateOne({"_id": PydanticObjectId(doc_id)}, {"$set": doc_data}))
                    else:
                        if operation == "DELETE":
                            bulk_ops.append(DeleteOne(identity_filter))
                        else:
                            # UPSERT basado en identidad compuesta
                            bulk_ops.append(UpdateOne(identity_filter, {"$set": doc_data}, upsert=True))
                except Exception as e:
                    errors.append(f"Error preparando {group_key}: {str(e)}")

            if bulk_ops:
                try:
                    # Ejecutar en lotes de 1000 para no saturar memoria
                    for i in range(0, len(bulk_ops), 1000):
                        chunk = bulk_ops[i:i + 1000]
                        res = await collection.bulk_write(chunk, ordered=False)
                        success_count += (res.modified_count + res.upserted_count + res.deleted_count + res.inserted_count)
                except Exception as e:
                    errors.append(f"Error en ejecución masiva: {str(e)}")
        else:
            # FLUJO SECUENCIAL (Para entidades complejas como Invoices)
            for group_key, group in grouped_data.items():
                doc_id = group["id"]
                identity_filter = group["identity_filter"]
                rows = group["rows"]
                
                try:
                    first_row = rows[0]
                    operation = first_row.get("operation", "UPDATE" if doc_id else "INSERT").upper()
                    doc_data = cls._reconstruct_parent(first_row, items_field)
                    
                    if items_field:
                        doc_data[items_field] = [cls._reconstruct_item(r) for r in rows if any(r.get(f"item_{k}") for k in ["sku", "product_id"])]

                    if doc_id:
                        try:
                            existing = await model.get(PydanticObjectId(doc_id))
                        except:
                            existing = None

                        if operation == "DELETE" and existing:
                            await existing.delete()
                            success_count += 1
                        elif existing:
                            await existing.update({"$set": doc_data})
                            success_count += 1
                        else:
                            errors.append(f"ID {doc_id} no encontrado.")
                    else:
                        if operation == "DELETE":
                            existing = await model.find_one(identity_filter)
                            if existing: await existing.delete()
                            success_count += 1
                        else:
                            new_doc = model(**doc_data)
                            await new_doc.insert()
                            success_count += 1
                except Exception as e:
                    errors.append(f"Error en {group_key}: {str(e)}")

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
