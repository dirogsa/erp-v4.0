# Arquitectura de Operaciones Multi-Empresa e Inter-Company

## 1. Contexto del Negocio
La operación del ERP se basa en una estructura de dos entidades legales que comparten infraestructura física pero mantienen identidades fiscales y beneficios aduaneros distintos.

### Entidades:
*   **JEEF ROJAS (Persona Natural con Negocio):** Entidad optimizada para la importación de productos desde Europa con beneficios arancelarios y regímenes de impuestos específicos. Es la "Propietaria Originaria" de la mercadería importada.
*   **DIROGSA SRL (Persona Jurídica):** Entidad de mayor prestigio corporativo utilizada para la comercialización a grandes clientes y empresas. Actúa como el "Front-end Comercial" principal.

## 2. El Modelo de Inventario Híbrido
Para soportar esta operación, el ERP utiliza un modelo donde el inventario se gestiona en dos capas:

### A. Capa Física (Custodia)
*   Existe un **Almacén Central Único**.
*   Ambas empresas tienen visibilidad total del stock físico disponible para garantizar la fluidez de las ventas.
*   El stock se descuenta en tiempo real independientemente de qué empresa emita el comprobante.

### B. Capa Legal (Propiedad)
*   Cada unidad de stock está vinculada legalmente a la empresa que la compró/importó.
*   El ERP rastrea la "Deuda de Stock" entre empresas.

## 3. Flujo de Venta Inter-Company (Back-to-Back)

Cuando se realiza una venta desde **DIROGSA** de productos cuya propiedad legal es de **JEEF**:

1.  **Venta Directa:** El sistema permite la emisión de la Factura/Boleta de DIROGSA al Cliente Final para no detener la operación.
2.  **Registro de Venta Cruzada:** El sistema marca internamente que DIROGSA ha utilizado activos de JEEF.
3.  **Regularización Automática (Inter-company Settlement):**
    *   Se genera una **Factura de Venta de JEEF a DIROGSA**.
    *   El precio utilizado es el "Precio de Transferencia" (Costo de importación + Margen mínimo legal).
    *   Se genera la **Factura de Compra en DIROGSA** para sustentar el costo de ventas.
    *   Se emite la **Guía de Remisión** por traslado de bienes entre establecimientos/empresas (si aplica según SUNAT).

## 4. Beneficios del Modelo
*   **Fluidez Operativa:** Los vendedores no necesitan preocuparse por quién es el dueño legal del stock al momento de facturar.
*   **Cumplimiento Legal (SUNAT):** Todas las transferencias de propiedad están sustentadas por documentos electrónicos correlativos.
*   **Optimización Fiscal:** Se aprovechan los menores costos de importación de la persona natural, trasladándolos legalmente a la persona jurídica.
*   **Trazabilidad Total:** El sistema puede auditar en cualquier momento qué productos de Jeef han sido vendidos por Dirogsa y qué documentos están pendientes de emisión.

## 5. Próximas Implementaciones Técnicas
*   **Monitor de Regularización:** Panel para el contador donde se visualizan las ventas cruzadas del día.
*   **Automatizador de Facturación Interna:** Servicio que emite los XML de facturación electrónica inter-company de forma masiva.
*   **Valuación de Inventario Consolidada:** Reporte que muestra el valor total del stock del grupo, sin importar la entidad legal.
