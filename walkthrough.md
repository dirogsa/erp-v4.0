# Walkthrough: Refactorización - Separación de Facturas

## Resumen
Se completó exitosamente la refactorización arquitectónica del sistema para separar las facturas en colecciones independientes (`sales_invoices` y `purchase_invoices`) de sus órdenes respectivas, mejorando la trazabilidad, flexibilidad y cumplimiento de mejores prácticas ERP.

## Cambios Realizados

### Backend

#### 1. Modelos Actualizados

**[sales.py](file:///D:/Projects/erp_system/backend/app/models/sales.py)**
```python
class SalesOrder(Document):
    """Orden de venta (Proforma) - Inmutable después de facturar"""
    order_number: str
    customer_name: str
    items: List[OrderItem]
    status: OrderStatus = OrderStatus.PENDING  # PENDING | INVOICED | CANCELLED
    total_amount: float
    # ✅ SIN campos de factura ni pago

class SalesInvoice(Document):
    """Factura de venta - Documento fiscal independiente"""
    invoice_number: str
    order_number: str  # Referencia
    customer_name: str
    invoice_date: datetime
    items: List[OrderItem]
    total_amount: float
    payment_status: PaymentStatus  # PENDING | PARTIAL | PAID
    amount_paid: float
    payments: List[Payment]  # Historial completo

class Payment(BaseModel):
    """Registro individual de un pago"""
    amount: float
    date: datetime
    notes: Optional[str]
```

**[purchasing.py](file:///D:/Projects/erp_system/backend/app/models/purchasing.py)**
- Misma estructura para `PurchaseOrder` y `PurchaseInvoice`

#### 2. Nuevos Endpoints

**Sales Routes ([sales.py](file:///D:/Projects/erp_system/backend/app/routes/sales.py))**
- `POST /sales/orders` - Crear orden de venta
- `GET /sales/orders` - Listar órdenes
- `POST /sales/invoices` - Crear factura desde orden
- `GET /sales/invoices` - Listar facturas
- `POST /sales/invoices/{invoice_number}/payments` - Registrar pago

**Purchasing Routes ([purchasing.py](file:///D:/Projects/erp_system/backend/app/routes/purchasing.py))**
- `POST /purchasing/orders` - Crear orden de compra
- `GET /purchasing/orders` - Listar órdenes
- `POST /purchasing/invoices` - Crear factura desde orden
- `GET /purchasing/invoices` - Listar facturas
- `POST /purchasing/invoices/{invoice_number}/payments` - Registrar pago

### Frontend

#### 3. API Services ([api.js](file:///D:/Projects/erp_system/frontend/src/services/api.js))

```javascript
export const salesService = {
  // Orders
  createOrder: (order) => api.post('/sales/orders', order),
  getSales: () => api.get('/sales/orders'),
  
  // Invoices
  createInvoice: (invoiceData) => api.post('/sales/invoices', invoiceData),
  getInvoices: () => api.get('/sales/invoices'),
  registerPayment: (invoiceNumber, paymentData) => 
    api.post(`/sales/invoices/${invoiceNumber}/payments`, paymentData),
};

export const purchasingService = {
  // Similar structure
};
```

#### 4. Componentes Actualizados

**[Sales.jsx](file:///D:/Projects/erp_system/frontend/src/pages/Sales.jsx)**
- Carga separada: `loadSalesOrders()` y `loadSalesInvoices()`
- Tab "Órdenes de Venta" muestra órdenes con estado PENDING/INVOICED
- Tab "Facturas de Venta" muestra facturas con estado de pago
- Modal "Registrar Factura" crea nueva factura (no actualiza orden)
- Modal "Registrar Pago" trabaja con facturas

**[Purchasing.jsx](file:///D:/Projects/erp_system/frontend/src/pages/Purchasing.jsx)**
- Misma estructura que Sales.jsx

## Flujos de Trabajo

### Flujo de Ventas

```
1. Usuario crea Orden de Venta
   → POST /sales/orders
   → Crea documento en sales_orders
   → Estado: PENDING
   → NO afecta inventario

2. Usuario registra Factura
   → POST /sales/invoices
   → Crea documento en sales_invoices
   → Actualiza sales_orders.status = INVOICED
   → Afecta inventario (OUT) ✅
   → Estado pago: PENDING

3. Cliente paga (parcial o total)
   → POST /sales/invoices/{invoice_number}/payments
   → Actualiza sales_invoices.amount_paid
   → Agrega a sales_invoices.payments[]
   → Calcula payment_status:
     - amount_paid >= total → PAID
     - amount_paid > 0 → PARTIAL
     - amount_paid = 0 → PENDING
```

### Flujo de Compras

```
1. Usuario crea Orden de Compra
   → POST /purchasing/orders
   → Crea documento en purchase_orders
   → Estado: PENDING
   → NO afecta inventario

2. Proveedor envía Factura
   → POST /purchasing/invoices
   → Crea documento en purchase_invoices
   → Actualiza purchase_orders.status = INVOICED
   → Afecta inventario (IN) ✅
   → Calcula costo promedio ponderado ✅
   → Estado pago: PENDING

3. Empresa paga (parcial o total)
   → POST /purchasing/invoices/{invoice_number}/payments
   → Actualiza purchase_invoices.amount_paid
   → Agrega a purchase_invoices.payments[]
   → Calcula payment_status automáticamente
```

## Beneficios Obtenidos

✅ **Separación de responsabilidades**: Orden ≠ Factura  
✅ **Inmutabilidad**: Órdenes no cambian después de facturar  
✅ **Historial de pagos**: Trazabilidad completa con array `payments[]`  
✅ **Flexibilidad**: Preparado para múltiples facturas por orden  
✅ **Reportes**: Fácil generar reportes separados de órdenes vs facturas  
✅ **Auditoría**: Mejor control de cambios  
✅ **Escalabilidad**: Listo para notas de crédito, facturación parcial  
✅ **Costo promedio**: Se calcula correctamente al facturar compras  

## Interfaz de Usuario

### Tab "Órdenes"
- Muestra todas las órdenes (PENDING o INVOICED)
- Botón 📄 "Factura" solo visible si estado = PENDING
- Al hacer clic en 📄 abre modal para ingresar:
  - Número de factura
  - Fecha de factura

### Tab "Facturas"
- Muestra todas las facturas
- Estado de pago con badges de colores:
  - 🟡 ○ PENDIENTE (amarillo)
  - 🟠 ◐ PARCIAL (naranja) + progreso "S/ X / S/ Total"
  - 🟢 ✓ PAGADO (verde)
- Botón ✏️ "Pago" solo visible si NO está PAGADO
- Al hacer clic en ✏️ abre modal para registrar pago:
  - Monto (validado ≤ pendiente)
  - Fecha de pago
  - Notas opcionales

## Plan de Pruebas

### ✅ Prueba 1: Flujo Completo de Ventas
1. Crear orden de venta con 2 productos
2. Verificar que aparece en tab "Órdenes" con estado PENDIENTE
3. Hacer clic en botón 📄 y registrar factura F001-00001
4. Verificar:
   - Orden cambia a estado FACTURADA
   - Factura aparece en tab "Facturas" con estado PENDIENTE
   - Inventario se reduce (OUT)
5. Registrar pago parcial de 50% del total
6. Verificar estado cambia a PARCIAL con progreso
7. Registrar pago del 50% restante
8. Verificar estado cambia a PAGADO

### ✅ Prueba 2: Flujo Completo de Compras
1. Crear orden de compra con 2 productos
2. Verificar que aparece en tab "Órdenes" con estado PENDIENTE
3. Hacer clic en botón 📄 y registrar factura F001-00001
4. Verificar:
   - Orden cambia a estado FACTURADA
   - Factura aparece en tab "Facturas" con estado PENDIENTE
   - Inventario aumenta (IN)
   - Costo promedio se recalcula
5. Registrar pago parcial
6. Verificar estado PARCIAL
7. Completar pago
8. Verificar estado PAGADO

### ✅ Prueba 3: Validaciones
1. Intentar facturar una orden ya facturada → Error
2. Intentar pagar más del monto pendiente → Error
3. Intentar registrar pago en factura PAGADA → Botón no visible

## Estructura de Datos

### Ejemplo: Orden de Venta
```json
{
  "order_number": "SALE-0001",
  "customer_name": "Cliente ABC",
  "date": "2025-11-25",
  "items": [
    {"product_sku": "LAP-001", "quantity": 2, "unit_price": 1500}
  ],
  "total_amount": 3000,
  "status": "INVOICED"
}
```

### Ejemplo: Factura de Venta
```json
{
  "invoice_number": "F001-00001",
  "order_number": "SALE-0001",
  "customer_name": "Cliente ABC",
  "invoice_date": "2025-11-26",
  "items": [...],
  "total_amount": 3000,
  "payment_status": "PARTIAL",
  "amount_paid": 1500,
  "payments": [
    {
      "amount": 1000,
      "date": "2025-11-27",
      "notes": "Transferencia bancaria"
    },
    {
      "amount": 500,
      "date": "2025-11-28",
      "notes": "Efectivo"
    }
  ]
}
```

## Notas Importantes

> [!IMPORTANT]
> El inventario se actualiza **solo al registrar la factura**, no al crear la orden.

> [!WARNING]
> Si tienes órdenes antiguas con facturas ya registradas en el sistema anterior, necesitarás migrar los datos manualmente o ejecutar un script de migración.

> [!TIP]
> El historial de pagos en `payments[]` permite generar reportes detallados de flujo de caja.

## Próximos Pasos Sugeridos

1. **Notas de Crédito:** Implementar sistema de devoluciones
2. **Facturación Parcial:** Permitir facturar solo parte de una orden
3. **Reportes:** Dashboard de cuentas por cobrar/pagar
4. **Recordatorios:** Notificaciones de pagos pendientes
5. **Exportación:** Generar reportes de facturas para contabilidad

---

## Cómo Ejecutar el Proyecto

### Requisitos Previos
- Python 3.10+ con entorno virtual activado
- Node.js 16+ instalado
- MongoDB corriendo localmente o en la nube

### 1. Iniciar el Backend

```bash
# Navegar al directorio del backend
cd d:\Projects\erp_system\backend

# Activar el entorno virtual (si no está activado)
venv\Scripts\activate

# Iniciar el servidor de desarrollo
venv\Scripts\python -m uvicorn main:app --reload
```

El backend estará disponible en: `http://localhost:8000`
- Documentación API: `http://localhost:8000/docs`

### 2. Iniciar el Frontend

```bash
# Navegar al directorio del frontend
cd d:\Projects\erp_system\frontend

# Iniciar el servidor de desarrollo
npm.cmd run dev
```

> [!IMPORTANT]
> En Windows PowerShell, usa `npm.cmd` en lugar de `npm` para evitar errores de política de ejecución.

El frontend estará disponible en: `http://localhost:5173`

---

## Gestión de Procesos (Troubleshooting)

### Problema: "Port already in use" o múltiples instancias corriendo

#### Listar procesos usando un puerto específico

**Para el frontend (puerto 5173):**
```bash
netstat -ano | findstr :5173
```

**Para el backend (puerto 8000):**
```bash
netstat -ano | findstr :8000
```

Esto mostrará algo como:
```
TCP    [::1]:5173    [::]:0    LISTENING    6340
```

El número al final (ej: `6340`) es el **PID** (Process ID).

#### Matar un proceso específico

```bash
taskkill /F /PID 6340
```

Reemplaza `6340` con el PID que obtuviste del comando anterior.

#### Script rápido para limpiar puertos

**Limpiar puerto 5173 (Frontend):**
```bash
# Listar procesos
netstat -ano | findstr :5173

# Copiar el PID y ejecutar
taskkill /F /PID <PID>
```

**Limpiar puerto 8000 (Backend):**
```bash
# Listar procesos
netstat -ano | findstr :8000

# Copiar el PID y ejecutar
taskkill /F /PID <PID>
```

### Reinicio Completo (Limpio)

Si tienes problemas con procesos duplicados o caché:

```bash
# 1. Detener todos los procesos de Node.js
taskkill /F /IM node.exe

# 2. Detener todos los procesos de Python (cuidado, esto afecta TODOS los Python)
taskkill /F /IM python.exe

# 3. Reiniciar backend
cd d:\Projects\erp_system\backend
venv\Scripts\python -m uvicorn main:app --reload

# 4. Reiniciar frontend (en otra terminal)
cd d:\Projects\erp_system\frontend
npm.cmd run dev
```

> [!WARNING]
> El comando `taskkill /F /IM python.exe` detendrá **todos** los procesos de Python en tu sistema. Úsalo solo si estás seguro de que no hay otros scripts de Python importantes corriendo.

### Verificar que los servicios están corriendo correctamente

**Backend:**
```bash
# Abrir en el navegador
http://localhost:8000/docs
```
✅ Si ves la documentación de FastAPI → Backend OK

**Frontend:**
```bash
# Abrir en el navegador
http://localhost:5173
```
✅ Si ves la interfaz del ERP → Frontend OK

### Limpiar caché del navegador

Si el frontend muestra código antiguo después de hacer cambios:

1. **Hard Refresh:** `Ctrl + Shift + R` (Windows/Linux) o `Cmd + Shift + R` (Mac)
2. **Abrir DevTools:** `F12` → pestaña "Network" → marcar "Disable cache"
3. **Borrar caché completa:** `Ctrl + Shift + Delete` → seleccionar "Cached images and files"
