# Plan Maestro: Búsqueda Avanzada por Marca y Origen (Especialista en Repuestos)

Este plan detalla la implementación de un sistema **Data-Driven** (basado en datos) para que el catálogo de repuestos se convierta en una herramienta de precisión, permitiendo al cliente buscar por la procedencia del vehículo (Europeo, Asiático, Americando).

---

## 🏗️ Fase 1: Backend & Modelado de Datos (La Base)
*Objetivo: Permitir el almacenamiento y extracción dinámica de marcas de vehículos.*

- [x] **Nuevo Modelo `VehicleBrand`**:
    - Campos: `name` (ID único), `origin` (Enum: EUROPE, ASIA, USA, OTHER), `logo_url`, `is_popular` (booleano para filtros rápidos).
- [x] **Endpoint `GET /shop/brands`**:
    - Debe devolver la lista de marcas agrupadas por origen.
- [x] **Sincronización Inteligente**:
    - Las marcas se registran automáticamente al guardar productos en el ERP.
- [x] **Actualización de `GET /shop/products`**:
    - Filtro por `vehicle_brand` integrado en la búsqueda global.

---

## 🛠️ Fase 2: ERP Admin - Gestión de Identidad (El Control)
*Objetivo: Permitir al administrador (tú) categorizar las marcas y subir logos.*

- [x] **Módulo "Gestión de Marcas de Vehículos"**:
    - Pantalla para ver todas las marcas extraídas del sistema.
    - Formulario para asignar el **Origen** (ej: Volvo -> Europeo) y subir el logo.
    - Switch para marcar como "Marca Destacada" (estas aparecerán en el carrusel principal).
- [x] **Integración en Inventario**:
    - Al crear/editar un producto, sugerencias de marcas existentes.
    - **Blindaje**: Validación visual (semáforo) y normalización a mayúsculas automática para evitar errores de tipeo.

---

## 🎨 Fase 3: Frontend Shop - Experiencia Premium (La Magia)
*Objetivo: Wow al cliente con una búsqueda visual e intuitiva.*

- [x] **Componente `BrandBrowser` (Slider de Marcas)**:
    - Carrusel de logos de marcas en el Catálogo.
- [x] **Selector de Origen (Iconos 🇪🇺 🇯🇵 🇺🇸)**:
    - Implementar botones de filtrado rápido por procedencia.
- [x] **UX Home Page**:
    - Carrusel de marcas compatibles directamente en la página de inicio.

---

## 🤖 Fase 4: Automatización & Refinamiento
*Objetivo: Que el sistema trabaje solo.*

- [x] **Brand Auto-Sync**: 
    - Sincronización en tiempo real al guardar productos y opción manual en Admin.
- [x] **Analítica de Búsqueda**:
    - Registro de búsquedas en el Backend para conocer la demanda de los clientes.

---

## 📝 Checklist de Progreso FINALIZADO ✅

### Backend
- [x] Definir Schema en `backend/app/models/inventory.py`
- [x] Implementar CRUD de marcas en `backend/app/routes/brands.py`
- [x] Servicio de extracción automática de marcas.
- [x] Sistema de analítica de búsquedas.

### ERP Admin (frontend-erp)
- [x] Crear página `BrandManagement.jsx`
- [x] Validación y normalización en `ProductForm.jsx`

### Tienda (frontend-shop)
- [x] Carrusel de marcas en Home y Catálogo.
- [x] Filtros por origen (Americano, Asiático, Europeo).

---
🎉 **PROYECTO COMPLETADO**
Tu sistema ahora gestiona marcas de forma profesional, automática y con una experiencia de usuario premium.
