
"Actúa como mi Arquitecto Senior. Antes de responder, lee la CONSTITUTION.md de mi proyecto y asegúrate de que tu solución no sea un parche, sino una pieza de ingeniería de clase mundial."


# 🏛️ ERP Master Architecture Constitution (World-Class Standard)

Este documento rige el diseño, desarrollo y mantenimiento de este ERP. Cualquier modificación o nueva funcionalidad DEBE adherirse a estos principios para garantizar escalabilidad, mantenibilidad e integridad financiera (Estilo Odoo/SAP).

## 1. Soberanía de la Empresa (Multi-Company Sovereignty)
*   **Principio**: Cada entidad legal (Company) es autónoma.
*   **Regla**: El IGV, el Método de Costeo y la Moneda Funcional se definen a nivel de EMPRESA, nunca de forma global ni estática en el código.
*   **Prohibición**: Prohibido usar valores hardcoded (ej: `amount * 0.18`). Siempre debe consultarse el `tax_percentage` de la empresa activa.

## 2. Gobernanza de Holding (Global Governance)
*   **Principio**: El sistema tiene una "identidad de plataforma" y una "moneda de reporte".
*   **Regla**: La `SystemConfig` solo maneja la identidad del software, la precisión decimal global y la moneda de consolidación.

## 3. Arquitectura de Dominio (Domain-Driven Design)
*   **Principio**: Las rutas (Routes) son solo mensajeros; los Servicios (Services) son el cerebro.
*   **Regla**: Toda lógica de negocio (conversión de moneda, cálculo de precios, impuestos) DEBE vivir en la carpeta `app/services/`. Las rutas solo llaman a estos servicios.

## 4. Inicialización Robusta (Bootstrap First)
*   **Principio**: El sistema nunca debe arrancar en un estado inválido o vacío.
*   **Regla**: Cada nuevo módulo crítico debe tener su lógica de "Seeding" en `app/core/setup_manager.py` para asegurar que existan datos base si la DB está vacía.

## 5. Integridad Financiera (Single Source of Truth)
*   **Principio**: El inventario se valoriza en la moneda de reporte para evitar desajustes por inflación o tipo de cambio.
*   **Regla**: Los costos base siempre se normalizan a la Moneda de Reporte del sistema, permitiendo comparativas reales entre empresas del mismo grupo.

## 6. Interfaz de Clase Mundial (Premium UI/UX)
*   **Principio**: Un ERP profesional debe "entrar por los ojos".
*   **Regla**: Uso de micro-animaciones (pulsos, estados), layouts respirables (grids), y manejo de estados de carga (LoadingScreens) en cada operación.

---
**Nota para la IA**: Si estás leyendo esto, no propongas parches rápidos. Propón soluciones que respeten esta jerarquía de objetos y servicios.
