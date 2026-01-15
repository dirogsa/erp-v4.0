# Plan de Optimización y Evolución: ERP Antigravity v4.0

Este plan detalla la hoja de ruta para transformar el sistema actual en un ERP robusto dividido por áreas funcionales, preparado para Control de Acceso Basado en Roles (RBAC).

---

## 1. Análisis del Estado Actual
El sistema cuenta con cimientos sólidos en **Ventas, Compras e Inventario**. Sin embargo, las funciones están mezcladas en menús generales y los modelos de datos aún no reflejan la autonomía total de cada área.

---

## 2. Propuesta de Arquitectura por Áreas

### 🟦 Área A: Comercial y Ventas (Front-Office)
*Responsable: Ejecutores de ventas / Vendedores.*
- **Objetivo:** Captación de clientes y negociación.
- **Funciones clave:**
    - Gestión de Cotizaciones (Quotes).
    - Seguimiento de estados comercial (Draft, Sent, Rejected).
    - Catálogo de productos con precios mayoristas/minoristas.
- **Mejora necesaria:** Dashboard de metas de ventas y trazabilidad de por qué se pierden cotizaciones.

### 🟩 Área B: Operaciones y Logística (Back-Office)
*Responsable: Jefe de Almacén / Despachadores.*
- **Objetivo:** Cumplimiento de pedidos y control de stock.
- **Funciones clave:**
    - Órdenes de Venta (Sales Orders) - El "corazón" operativo.
    - Guías de Remisión (Dispatch Guides).
    - Control de Pesos (incorporado recientemente).
    - Gestión de Backorders (Pedidos pendientes de stock).
- **Mejora necesaria:** Inventario por almacenes físicos (actualmente es un stock global). Separar la "Recepción de Mercadería" (Compras) del "Despacho" (Ventas).

### 🟧 Área C: Finanzas y Tesorería
*Responsable: Contador / Administrador Financiero.*
- **Objetivo:** Flujo de caja y legalidad fiscal.
- **Funciones clave:**
    - Facturación Electrónica (Invoices) y Notas de Crédito/Débito.
    - Registro de Pagos y Abonos.
- **Mejora necesaria:** 
    - Crear el concepto de **"Caja Chica"** o **"Cuentas Bancarias"**. Actualmente los pagos son solo marcas en la factura; no hay un destino del dinero.
    - Reporte de Cuentas por Cobrar (Aging report).

### 🟪 Área D: Compras y Abastecimiento
*Responsable: Comprador / Logística de entrada.*
- **Objetivo:** Reposición de inventario al mejor costo.
- **Funciones clave:**
    - Órdenes de Compra y Facturas de Proveedor.
- **Mejora necesaria:** Implementar la lógica de **Facturación Parcial en Compras** (igual a la que hicimos en ventas) para manejar casos donde el proveedor envía la mercadería en partes.

---

## 3. Plan de Acción Técnico (Optimization Roadmap)

### Fase 1: Refactorización de Datos (Backend Senior)
1.  **Unificación de Trazabilidad:** Llevar el modelo de `invoiced_quantity` a Compras para permitir recepciones parciales.
2.  **Entidad "Transacción Financiera":** Crear un modelo que registre movimientos de dinero (Ingreso/Egreso) vinculado a facturas pero independiente de ellas.

### Fase 2: Interfaz Basada en Contexto (Frontend UX)
1.  **Diferenciación Visual:** Usar esquemas de color sutiles por área (Ej: Cabeceras azules para Ventas, verdes para Almacén).
2.  **Menú Inteligente (Post-RBAC):** Preparar el `Sidebar` para colapsar secciones enteras según el rol.
3.  **Dashboards Específicos:** 
    - El Vendedor ve: *Mis ventas del mes, Mis cotizaciones vencidas*.
    - El Almacenero ve: *Pedidos por despachar hoy, Productos con stock mínimo*.
    - El Administrador ve: *Flujo de caja total, Utilidad bruta*.

### Fase 3: Seguridad y Roles
1.  **Middleware de Permisos:** Implementar lógica para que un Vendedor NO pueda borrar una Factura ni ver los costos de compra (margen de utilidad).
2.  **Logs de Auditoría:** Registrar quién cambió un precio o quién anuló una nota de crédito.

---

## 4. Diferencias Notables por Responsable (Simulación)

| Rol | Vista Principal | Acceso a Precios | Capacidad de Anulación |
| :--- | :--- | :--- | :--- |
| **Vendedor** | Cotizaciones y Catálogo | Solo Venta (Retail/Wholesale) | Solo Cotizaciones Propias |
| **Almacenero** | Guías de Despacho y Stock | No ve precios | No puede anular nada |
| **Contador** | Invoices y Notas de Crédito | Ve Costo y Venta | Full Facturación |
| **SuperAdmin** | Dashboard Analítico Total | Full | Full |

---

> **Nota Final:** El sistema ha evolucionado de un simple registro a un flujo operativo real. La separación por áreas evitará errores humanos y permitirá que el personal de almacén no se distraiga con temas contables, y viceversa.
