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
                natural_key_val = group["natural_key_val"]
                first_row = group["rows"][0]
                
                try:
                    operation = first_row.get("operation", "UPDATE" if doc_id else "INSERT").upper()
                    # Reconstruir datos base
                    doc_data = cls._reconstruct_parent(first_row, items_field)
                    
                    # VALIDACIÓN Y CASTEO: Usamos el modelo para limpiar los datos (ej: castear strings a int/float)
                    try:
                        # Creamos una instancia parcial/total para validar tipos (usamos model_validate)
                        # Nota: Si es UPDATE, puede que falten campos obligatorios, por lo que usamos un truco 
                        # o simplemente validamos que los campos presentes coincidan en tipo.
                        # Para este ERP, usaremos model.model_validate con datos parciales o el objeto completo.
                        validated_doc = model.model_validate(doc_data)
                        doc_data = validated_doc.model_dump(exclude={"id"}, exclude_none=True)
                    except Exception as ve:
                        # Si falla la validación fuerte, intentamos seguir pero avisamos
                        errors.append(f"Aviso en {group_key}: Validación de tipos falló, se usará data original. Error: {str(ve)}")
                    
                    if doc_id:
                        if operation == "DELETE":
                            bulk_ops.append(DeleteOne({"_id": PydanticObjectId(doc_id)}))
                        else:
                            bulk_ops.append(UpdateOne({"_id": PydanticObjectId(doc_id)}, {"$set": doc_data}))
                    else:
                        if operation == "DELETE":
                            bulk_ops.append(DeleteOne({parent_key: natural_key_val}))
                        else:
                            # Para INSERT, necesitamos validar si ya existe por llave natural si no hay ID
                            # O simplemente intentar insertar y que el índice único falle (pero bulk_write fallaría todo el lote)
                            # Mejor: Usaremos upsert por natural_key si no hay ID para ser más tolerantes
                            bulk_ops.append(UpdateOne({parent_key: natural_key_val}, {"$set": doc_data}, upsert=True))
                except Exception as e:
                    errors.append(f"Error preparando fila {group_key}: {str(e)}")

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
            # FLUJO SECUENCIAL (Para entidades complejas con ítems como Facturas/Órdenes)
            for group_key, group in grouped_data.items():
                doc_id = group["id"]
                natural_key_val = group["natural_key_val"]
                rows = group["rows"]
                
                try:
                    first_row = rows[0]
                    operation = first_row.get("operation", "UPDATE" if doc_id else "INSERT").upper()
                    doc_data = cls._reconstruct_parent(first_row, items_field)
                    
                    if items_field:
                        doc_data[items_field] = [cls._reconstruct_item(r) for r in rows if r.get("item_product_sku") or r.get("item_sku") or r.get("item_product_id")]

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
                            existing = await model.find_one({parent_key: natural_key_val})
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
