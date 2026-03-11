# Plan de Optimización: Mobile-First Lite Experience

Este documento detalla la estrategia para implementar una tercera interfaz de usuario enfocada exclusivamente en dispositivos móviles, diseñada para ser rápida, minimalista y eficiente.

## 1. Análisis de la Situación Actual

Actualmente el sistema cuenta con:
- **Backend**: API robusta en FastAPI/MongoDB con soporte para clasificaciones de cliente (`BRONCE`, `PLATA`, `ORO`, `DIAMANTE`) y sistema de lealtad.
- **Frontend ERP**: Administración interna (Desktop).
- **Frontend Shop**: Tienda online optimizada para pantallas grandes.

---

## 2. Casos de Uso Críticos (Fase 1 & 2)

### Caso 1: Cotizaciones Inteligentes y Fidelización
El cliente podrá interactuar con el catálogo de forma fluida para generar sus propias cotizaciones.
- **Precios Dinámicos**: El sistema detectará automáticamente el nivel del cliente (`BRONCE` a `DIAMANTE`) y aplicará los descuentos/tarifas correspondientes en tiempo real.
- **Carrito de Cotización**: Una lista persistente donde el cliente agrega productos. Al finalizar, genera un PDF/Ticket de cotización y lo envía opcionalmente a su correo.

### 2. Canje de Regalos y Merchandising (No Filtros)
*   **Wallet Flotante**: Un pequeño indicador en la parte superior que diga: *"Tienes 1,500 puntos"*.
*   **Sección de Regalos (Independiente)**: Los puntos se canjean por materiales de marketing como libretas, polos, lapiceros y otros extras. Estos no interfieren con el stock comercial de filtros.
*   **Sugerencia de Canje**: En el carrito, si el cliente tiene puntos suficientes, aparecerá un mensaje minimalista: *"¡Felicidades! Puedes llevar este [Polo Dirogsa] gratis con tus puntos. ¿Canjear?"* (Botón de un solo toque).
    - *Nota*: Los canjes son exclusivamente para productos de marketing y regalos (libretas, polos, lapiceros), manteniendo los filtros como el producto principal de venta.
    - Ejemplo: "¡Tienes puntos para llevar una Libreta Dirogsa gratis!".

### Caso 2: Consulta de Estado y Pedidos
Foco en la transparencia de datos sin necesidad de llamar a un vendedor.
- **Estado de Cuenta**: Una tarjeta resumen que muestra el saldo pendiente, facturas vencidas y línea de crédito disponible.
- **Mis Pedidos**: Lista simplificada de órdenes con estados visuales (Pendiente 🕒, Despachado 🚚, Entregado ✅).
- **Visualizador de Facturas**: Opción de descargar el PDF de cualquier factura o guía de remisión directamente al celular.

### Caso 3: Pedido Predictivo (Próxima Fase)
- **Generación Tentativa**: El sistema analizará los últimos 3 pedidos del cliente y generará una "Sugerencia de Reposición" automática. El cliente solo revisa y confirma.

---

## 3. Estrategia de Diseño Minimalista (UX "Lite")

Para evitar "marear" al usuario, implementaremos estas reglas de diseño:

1. **Jerarquía Visual Inversa**:
    - Lo más importante (Precio y Stock) tendrá el tamaño de fuente más grande.
    - Los detalles técnicos se ocultarán tras un botón de "Info" para no saturar la pantalla.
2. **Navegación de Pulgar (Bottom Nav)**:
    - **[📦 Catálogo]**: Grilla de 2 columnas con fotos grandes.
    - **[📊 Mi Estado]**: Acceso directo a deudas y puntos.
    - **[🛒 Carrito]**: Flotante y siempre visible si hay ítems.
    - **[👤 Perfil]**: Datos de configuración y cierre de sesión.
3. **Filtros "Un-Solo-Tap"**:
    - Botones circulares para marcas populares (Toyota, Nissan, etc.) que filtran el catálogo con un toque.
4. **Modo "Sin Distracciones"**:
    - Checkout de un solo paso: Confirmar dirección -> Confirmar método -> Enviar Pedido.

---

## 4. Detalles de Clasificación de Clientes

Para tu referencia, estas son las categorías configuradas en el sistema:
- **BRONCE**: Cliente inicial / minorista.
- **PLATA**: Cliente frecuente.
- **ORO**: Socio estratégico con descuentos preferenciales.
- **DIAMANTE**: Máximo nivel, acceso a precios mayoristas base y prioridad en despacho.

---

## 5. Implementación Técnica

### Fase 1: Core Mobile (Semanas 1-2)
- Configuración de PWA (App instalable).
- Vista de Catálogo con Precios según `UserTier`.
- Carrito de Cotización y Generación de Pedido.

### Fase 2: Módulo Financiero y Lealtad (Semanas 3-4)
- Dashboard de Puntos y Canje.
- Vista de Facturas y Estado de Cuenta (Integración con módulo de Finanzas).
- Historial de pedidos detallado.

**¿Qué te parece este enfoque? Si estás de acuerdo, podemos comenzar con la inicialización del proyecto `frontend-mobile`.**
