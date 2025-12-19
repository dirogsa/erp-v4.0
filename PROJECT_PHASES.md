# Estado del Proyecto: Funcionalidades Avanzadas

Este documento detalla las fases de implementación para las nuevas funcionalidades de Ventas y Compras.

## ✅ Fase 1: Cotizaciones de Venta (Completado)
**Estado:** Finalizado
**Descripción:** Implementación completa del ciclo de vida de las cotizaciones (Crear, Ver, Editar, Eliminar) y su visualización en PDF.
- [x] Backend: Modelo `SalesQuote` y Estado (`QuoteStatus`)
- [x] Backend: Servicios y Rutas API (CRUD)
- [x] Frontend: Nueva pestaña "Cotizaciones" en módulo de Ventas
- [x] Frontend: Tabla y Formulario de Cotizaciones
- [x] Frontend: Generación de Recibo/PDF (Proforma)

## ✅ Fase 2: Conversión Inteligente y Backorders (Completado)
**Estado:** Finalizado
**Descripción:** Capacidad de convertir una cotización en una orden de venta real, manejando inventario insuficiente mediante Backorders opcionales.
- [x] Backend: Servicio de verificación de stock
- [x] Backend: Lógica de conversión (Cotización -> Orden + Backorder)
- [x] Frontend: UX para confirmar conversión y visualizar ítems faltantes
- [x] Frontend: Gestión de referencias de Backorder (Automático)

## ✅ Fase 3: Solicitudes de Compra (RFQs) (Completado)
**Estado:** Finalizado
**Descripción:** Implementación "espejo" de las cotizaciones pero para el flujo de compras (Solicitar cotización a proveedores).
- [x] Backend: Modelo `PurchaseQuote` (RFQ)
- [x] Backend: Conversión a Orden de Compra
- [x] Frontend: Gestión de Solicitudes en módulo de Compras

## ✅ Fase 4: Notas de Crédito y Débito (Completado)
**Estado:** Finalizado
**Descripción:** Documentos financieros para correcciones y ajustes de facturas emitidas.
- [x] Backend: Modelos `CreditNote` y `DebitNote`
- [x] Backend: Lógica de anulación/devolución de stock y ajuste de saldos
- [x] Frontend: Interfaz para emitir notas desde una factura existente

## 🚀 Fase 5: Reportes y Dashboard (EN CURSO)
**Estado:** Siguiente paso inmediato
**Descripción:** Implementación de panel de control principal y reportes detallados para toma de decisiones.
- [ ] Backend: Endpoints de agregación (Kardex valorizado, Ventas por período, Top Productos)
- [ ] Frontend: Dashboard Principal (KPIs en tiempo real)
- [ ] Frontend: Módulo de Reportes (Ventas, Compras, Inventario)
- [ ] Frontend: Visualización gráfica (Gráficos de barras/líneas)
