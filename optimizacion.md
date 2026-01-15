# Plan de Optimización y Evolución: ERP Antigravity v4.0

Este documento detalla la estrategia de arquitectura para la implementación de un **Motor de Precios Avanzado** y un **Módulo de Control de Riesgos**, asegurando la omnicanalidad entre el ERP y la Shop Online.

---

## 1. Centro de Control de Políticas Comerciales (Editable)
Como arquitecto, mi recomendación es centralizar estas variables en una nueva sección del ERP llamada **"Configuración de Ventas"** o **"Políticas Comerciales"**.

### ⚙️ Interfaz de Configuración de Recargos
Implementaremos una tabla maestra donde el SuperAdmin podrá definir y editar:
*   **Contado:** 0% (Fijo).
*   **Crédito 30 días:** Editable (ej: 3.00%).
*   **Crédito 60 días:** Editable (ej: 5.00%).
*   **Crédito 90 días:** Editable (ej: 8.00%).
*   **Crédito 180 días:** Editable (ej: 15.00%).

> **Impacto:** Cualquier cambio en esta tabla se propagará inmediatamente a todo el sistema (ERP Local y Shop Web), recalculando precios dinámicamente sin tocar código.

---

## 2. Omnicanalidad B2B: Sincronización con Frontend-Shop
La tienda online debe ser un reflejo exacto de las capacidades financieras del cliente definidas en el ERP.

### � Validación Cruzada (ERP → SHOP)
Al momento de que un cliente se loguee en `frontend-shop`:
1.  **Regla de Visibilidad:** El sistema consultará el `CreditProfile` del cliente en la base de datos central.
2.  **Filtrado de Opciones:** 
    *   Si el cliente tiene `status_credit: FALSE`, la pasarela de pagos web **OCULTARÁ completamente** la opción "Pago a Crédito". Solo podrá finalizar la compra mediante métodos de contado (Transferencia, Tarjeta, etc.).
    *   Si tiene `status_credit: TRUE`, solo aparecerán en el selector los plazos (`allowed_terms`) que el administrador le haya habilitado en su ficha de cliente.
3.  **Precios Personalizados:** Los precios mostrados en la Shop se ajustarán automáticamente aplicando el recargo correspondiente al plazo seleccionado por el cliente.

---

## 3. Arquitectura de Control de Riesgos
El flujo de crédito no es una opción abierta, sino un privilegio otorgado.

### 🟦 Perfil Crediticio del Cliente (Ficha ERP)
Campos clave a implementar en la ficha de cada cliente registrada desde el ERP:
*   **status_credit:** (BOOL) Activo/Inactivo.
*   **allowed_terms:** (ARRAY) Lista de plazos permitidos (ej: `[30, 60]`).
*   **credit_limit:** (DECIMAL) Monto máximo de deuda permitido (Suma de facturas pendientes + pedido actual).
*   **risk_score:** Clasificación interna (A, B, C).

---

## 4. Mejoras "Senior" Sugeridas (Plus de Calidad)

Aparte de lo solicitado, como arquitecto sugiero estas 3 mejoras para convertir el sistema en una herramienta de nivel profesional:

### A. Control de Deuda Vencida (Hard Stop)
*   **Lógica:** Si un cliente tiene una sola factura vencida (ej. con más de 5 días de retraso), el sistema debe bloquear **automáticamente** tanto en el ERP como en la Shop la capacidad de realizar nuevos pedidos a crédito, obligándolo a pagar su deuda o comprar al contado.

### B. Notificaciones de Crédito (Alert Automation)
*   **Lógica:** Cuando un cliente está por alcanzar el 90% de su `credit_limit`, el sistema envía un correo/alerta al vendedor para que gestione cobranzas proactivamente antes de que el cliente intente comprar en la Shop y se encuentre con un bloqueo.

### C. Workflow de Aprobación de Riesgos
*   **Lógica:** Permitir adjuntar documentos (reportes de Infocorp, estados financieros) en la ficha del cliente. Cuando un vendedor quiere habilitar crédito a un cliente nuevo, envía una "Solicitud de Crédito" interna que el Gerente de Finanzas aprueba con un solo clic desde su Dashboard.

---

## 5. UI/UX: Grilla de Precios Masiva
Estandarizar la carga de precios en el ERP usando el mismo motor de búsqueda de las cotizaciones:
*   **Fast Entry:** Input que permite añadir productos sumando filas rápidamente.
*   **Vista Previa Multivariable:** Una tabla que muestra simultáneamente: `Precio Base | Precio 30d | Precio 60d | ... | Margen de Utilidad`.

---

> **Visión Final:** Un ecosistema donde el **SuperAdmin** dicta las reglas (porcentajes de recargo), el **ERP** las ejecuta con rigor financiero y la **Shop** se adapta inteligentemente al perfil de cada cliente, eliminando riesgos de incobrables.
