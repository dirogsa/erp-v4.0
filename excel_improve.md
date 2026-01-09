# Plan de Implementación: Interfaz de Cotización Estilo Excel (Nativo)

Este documento detalla el plan técnico para refactorizar la interfaz de creación de cotizaciones en el componente `ProductItemsSection.jsx` y el backend asociado. El objetivo es emular la experiencia de usuario de una hoja de cálculo (Excel) utilizando exclusivamente React estándar y CSS, sin dependencias de grillas de terceros.

## Objetivo
Transformar el flujo actual de "Formulario de Agregar -> Tabla de Lectura" a una "Grilla Editable Continua" que permita:
1.  Ingreso rápido de datos sin cambiar de contexto.
2.  Navegación por teclado (Flechas, Enter, Tab).
3.  Visualización inmediata de atributos (Stock).
4.  Acceso rápido a precios históricos del cliente.

---

## Fase 1: Backend (Preparación de Datos)

Antes de tocar la interfaz, debemos asegurar que la API entregue la información necesaria.

### 1.1. Optimización de Búsqueda de Productos
*   **Archivo:** `backend/app/routes/products.py` (o servicio correspondiente).
*   **Tarea:** Asegurar que el endpoint de búsqueda de productos devuelva el campo `stock_quantity` (o equivalente) junto con los precios. Esto es crítico para que la celda de stock se llene automáticamente.

### 1.2. Refinamiento de Historial de Precios
*   **Archivo:** `backend/app/routes/sales.py` y `backend/app/services/sales_service.py`.
*   **Tarea:** Modificar el endpoint `get_product_history`.
    *   **Estado Actual:** `GET /sales/products/{sku}/history` (Trae historial global o mixto).
    *   **Cambio:** Agregar parámetro opcional `customer_id`.
    *   **Lógica:** Si llega `customer_id`, filtrar las facturas (`SalesInvoice`) donde `customer.id` coincida. Esto permitirá al botón de "Precio Histórico" mostrar cuánto se le cobró *específicamente a este cliente* anteriormente.

---

## Fase 2: Arquitectura Frontend (React)

Reemplazaremos la lógica actual de `ProductItemsSection.jsx` por un manejo de estado basado en filas editables.

### 2.1. Estructura de Datos (State)
En lugar de `selectedProduct` separado de `items`, el estado será una lista única de objetos que representan las filas de la grilla.

```javascript
const [rows, setRows] = useState([
  { id: 1, sku: '', name: '', quantity: 1, price: 0, stock: 0, total: 0, isNew: true }
]);
```

### 2.2. Componente de Fila (`EditableRow`)
Crearemos un sub-componente para cada fila que maneje sus propios inputs.
*   **Inputs:** SKU (Buscador), Nombre (Readonly), Cantidad (Number), Precio (Number + Dropdown Historial), Stock (Readonly), Total (Calculado).
*   **Refs:** Cada input tendrá una referencia para gestionar el foco manualmente.

### 2.3. Lógica de "Buscador en Celda"
*   El input de `SKU/Nombre` no será un simple texto, sino un `input` que, al escribir, despliega una lista flotante (`absolute position`) dbeajo de la celda.
*   Al seleccionar un producto con `Enter`:
    1.  Rellena `Nombre`, `Precio` (del maestro), `Stock`.
    2.  Mueve el foco automáticamente a la celda `Cantidad`.

### 2.4. Navegación por Teclado (Simulación Excel)
Implementaremos un manejador de eventos `onKeyDown` global en la tabla o en cada input:
*   **Enter:**
    *   Si está en la última celda de la fila -> Crea una nueva fila vacía y mueve el foco al primer campo de ella.
    *   Si está en medio -> Mueve el foco a la siguiente celda lógica.
*   **Flechas Arriba/Abajo:** Mover el foco a la misma columna de la fila anterior/siguiente.
*   **Delete/Backspace (en fila vacía):** Eliminar la fila.

---

## Fase 3: Detalle de Implementación de Funcionalidades Clave

### 3.1. Visualización de Stock
*   **UI:** Una columna "Stock" entre Nombre y Cantidad.
*   **Lógica:** Al seleccionar el producto en la columna 1, el valor `product.stock` se copia al estado de la fila.
*   **Estilo:** Si `stock <= 0`, el texto se pone rojo. Si `stock < cantidad_ingresada`, borde rojo en cantidad.

### 3.2. Botón de Precio Histórico
*   **UI:** Un pequeño botón (icono de reloj) dentro del `div` que envuelve el input de Precio.
*   **Interacción:**
    1.  Usuario hace click o presiona atajo (ej: `Ctrl+H`) estando en el precio.
    2.  Se llama a la API: `get_product_history(sku, customer_id)`.
    3.  Aparece un pequeño modal/popover *encima* de la celda.
    4.  Muestra lista: "01/01/2025 - S/ 50.00".
    5.  Click en un item -> Actualiza el valor del input Precio y cierra el popover.

---

## Ventajas y Desventajas de NO usar Librerías (Desarrollo "A Mano")

### Ventajas
1.  **Control Total:** Tienes control absoluto sobre cada píxel y comportamiento. No hay "cajas negras" ni estilos que sobreescribir con `!important`.
2.  **Peso Ligero:** No agregas librerías pesadas al bundle del proyecto (AG Grid puede ser pesado).
3.  **Consistencia Visual:** Usarás exactamente tus mismos `className` de Tailwind y componentes de UI existentes (`Input`, `Button`), asegurando que se vea idéntico al resto del sistema.
4.  **Flexibilidad Extrema:** Si mañana quieres que una celda se comporte de forma muy específica (ej: que cambie de color según el clima), es fácil de programar.

### Desventajas
1.  **Complejidad de Desarrollo (Tiempo):** Cosas que las librerías traen gratis (navegación por teclado virtuosa, virtualización de listas largas, copiar/pegar rangos, redimensionar columnas) tendrás que programarlas tú mismo.
2.  **Mantenimiento de "Beresenjenales" (Edge Cases):** Manejar el foco del navegador es difícil. ¿Qué pasa si borras la fila 2 y el foco estaba ahí? ¿Qué pasa si tabulas muy rápido? Tendrás que depurar estos comportamientos manualmente.
3.  **Rendimiento en Listas Largas:** Si una cotización tiene 500 items, renderizar 500 filas de inputs con React puro puede ser lento si no se implementa `React.memo` correctamente. Las librerías de grid usan "virtualización" (solo renderizan lo que se ve en pantalla) por defecto.
