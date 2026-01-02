# Plan Maestro: Precios Dinámicos B2B y Sincronización Omnicanal (DIROGSA V4.0)

Este documento detalla la estrategia para transformar el sistema en una plataforma B2B de alto nivel, permitiendo precios personalizados por cliente y una gestión centralizada desde el ERP.

---

## 🏗️ Fase 1: Arquitectura de Datos y Clasificación
*Objetivo: Sentar las bases para que el sistema reconozca diferentes tipos de clientes.*

- [ ] **Clasificación de Usuarios (Tiers)**:
    - Extender el modelo de `User` para incluir el campo `classification` (Enum: `BRONCE`, `PLATA`, `ORO`, `DIAMANTE`, `STANDARD`).
- [ ] **Modelo de Reglas de Precio (`PricingRule`)**:
    - Crear una nueva colección/tabla para almacenar las reglas.
    - Campos: `classification`, `category_id`, `brand`, `discount_percentage`, `fixed_price` (opcional).

---

## 🛠️ Fase 2: Módulo de Gestión para el Superadmin (ERP)
*Objetivo: ¿Dónde se modifican los precios visualmente?*

- [ ] **Nueva Sección: "Administración de Precios B2B"**:
    - Ubicación: Un nuevo ítem en el menú lateral del ERP bajo el grupo de **Administración**.
    - **Panel de Reglas**: Una interfaz donde el Superadmin pueda crear reglas globales.
        - *Ejemplo*: Filtro de búsqueda por Marca "WIX" + Nivel "ORO" -> Definir 20% de descuento.
- [ ] **Gestión de Socios en B2BManagement**:
    - Al momento de aprobar una solicitud B2B, añadir un selector para definir su nivel inicial.
    - Posibilidad de cambiar el nivel de un cliente existente con un par de clics.

---

## 📡 Fase 3: Dashboard Omnicanal y CRM (Sincronización)
*Objetivo: Que el Admin sepa todo lo que pasa en la web al instante.*

- [ ] **Feed de Actividad en Tiempo Real**:
    - Implementar un panel en el Dashboard principal del ERP que muestre:
        - ✅ "Nuevo cliente Empresa registrado: [Nombre] - Pendiente de Clasificación".
        - 📄 "Nueva cotización Web recibida de [Cliente ORO] por S/ X,XXX.XX".
- [ ] **Directorio Unificado de Clientes**:
    - Una vista que consolide clientes locales y web, permitiendo ver su historial de cotizaciones y su clasificación actual.

---

## 🛒 Fase 4: Experiencia de Compra Inteligente (Shop)
*Objetivo: Que el cliente vea "sus" precios.*

- [ ] **Motor de Precios Dinámicos**:
    - Modificar la API `/shop/products` para que identifique al usuario logueado.
    - El sistema calculará en tiempo real: `Precio Final = Precio Base - Descuento(Nivel + Marca/Categoría)`.
- [ ] **UI Transparente**:
    - Mostrar un distintivo en la tienda: "Socio ORO: Estás ahorrando un [X]% adicional en esta marca".
    - El carrito aplicará automáticamente el precio correspondiente al nivel del socio.

---

## 📝 Roadmap de Implementación (Checklist)

### 🖥️ Backend
- [ ] Script de migración para añadir `classification` a usuarios.
- [ ] Endpoints CRUD para `PricingRules`.
- [ ] Lógica interna para el cálculo de precio prioritario (Regla B2B > Descuento Volumen).

### 🏢 ERP Frontend
- [ ] Crear página `PricingRulesManagement.jsx` (La interfaz de control).
- [ ] Integrar notificaciones de actividad web en el Dashboard.
- [ ] Actualizar el modal de edición de B2B para incluir el Tier.

### 🛍️ Tienda Online
- [ ] Refactorizar el contexto de autenticación para persistir el Tier del usuario.
- [ ] Actualizar visualmente los productos para mostrar "Tu Precio de Socio".

---
*Nota: Este flujo garantiza que el administrador tiene el control total sobre los márgenes de ganancia, mientras que el cliente recibe una experiencia personalizada que fomenta la fidelización.*
