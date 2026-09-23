# Pendientes: Arquitectura de Inventario Federado Corporativo

> Patrón: Catálogo Maestro Global + Stock Distribuido por Empresa

---

## 1. Modelo de Datos — `CompanyProductData`
- Verificar y formalizar los campos mínimos: `stock_current`, `stock_reserved`, `cost`, `is_active` por empresa.
- Asegurar que toda escritura de stock (ventas, compras, ajustes) apunte al `company_data[company_id]` correcto, no a un campo raíz global.

## 2. Permisos de Lectura Cruzada
- Definir rol/permiso `VIEW_CORPORATE_STOCK`: permite a una empresa ver el stock de las demás, pero no modificarlo.
- El endpoint `GET /inventory/products` debe devolver, opcionalmente, el stock de todo el grupo corporativo cuando se solicita con ese permiso.

## 3. `bulk_fetch_products` — Enriquecimiento por Empresa
- Cuando el modelo multi-empresa esté activo, enriquecer la respuesta del bulk fetch inyectando `company_data[company_id].stock_current` en lugar del stock global.
- El mapa de búsqueda (`\ clean_sku`) no cambia; solo cambia el campo de stock devuelto.

## 4. Módulo de Transferencias Intercompany
- Flujo: Empresa C solicita → Empresa B aprueba → Se decrementa `stock_current` de B y se incrementa el de C.
- Usar el módulo de `TransferOut` existente como base, añadiendo `source_company_id` y `target_company_id`.
- Registrar movimiento en auditoría de ambas empresas.

## 5. Política de Costos en Transferencia
- Decidir la regla corporativa: ¿se transfiere al costo de compra del origen, o al costo promedio corporativo?
- Implementar como configurable en `CompanySettings`.

## 6. Prevención de Colisiones de Stock
- Si la Empresa B vende y la Empresa C solicita el mismo lote simultáneamente, el `stock_reserved` de B debe bloquearse antes de aprobar la transferencia.
- Evaluar si se necesita un lock optimista (versión/timestamp) a nivel de documento.
