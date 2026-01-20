# Plan de Simplificación: Motor de Precios Relacionales (ERP v4.0)

Este plan detalla la transición de una gestión de precios manual a una **Arquitectura de Precios Basada en Márgenes**, donde el **Precio al por Mayor** es el único dato de entrada manual.

---

## 🔝 Fase 1: El Precio Ancla (Wholesale Core)
El objetivo es que el administrador solo piense en el valor mayorista del producto. El resto es consecuencia matemática.

- [x] **1.1 Definición de Markup Retail:** Crear un campo global en el módulo de Políticas llamado "Margen de Canal Minorista" (ej: +20% sobre el precio mayorista).
- [x] **1.2 Descuentos por Volumen Sistémicos:** Establecer porcentajes estándar por categoría (ej: 6u = -3%, 12u = -7%, 24u = -12%) para evitar llenarlos uno a uno.
- [x] **1.3 Bloqueo de Input Secundario:** Deshabilitar la edición manual del Precio Minorista en el ERP para garantizar la coherencia de márgenes.

---

## ⚙️ Fase 2: Motor de Cálculo en Cascada (Frontend)
Refactorizar la UI de "Actualización Masiva" para que sea un simulador en tiempo real.

- [x] **2.1 Edición Pivote:** Al modificar el campo "Precio Mayorista", el sistema debe disparar un evento de recálculo instantáneo para todas las demás columnas.
- [x] **2.2 Visualización de Fórmulas:** Mostrar una pequeña leyenda debajo de los precios calculados (ej: "M. Mayorista + 15%") para que el usuario sepa de dónde sale el número.
- [x] **2.3 Redondeo Psicológico Automático:** Implementar una regla opcional que, tras aplicar los porcentajes, redondee automáticamente a .90 o .00 para mantener la estética comercial.

---

## 🛡️ Fase 3: Integración Financiera y Créditos
Vincular los plazos de pago (30, 60, 90, 180 días) con el precio ya calculado.

- [ ] **3.1 Proyección Financiera Dinámica:** Las columnas de crédito deben ser "Read-Only" y basarse siempre en el resultado del Precio Mayorista * Margen Minorista (si aplica) * Recargo de Plazo.
- [ ] **3.2 Alerta de Margen de Seguridad:** Si el precio con descuento por volumen (ej: 24u) cae por debajo del costo de compra + 5%, el sistema debe pintar una alerta roja (Stop-Loss).

---

## 🚀 Fase 4: Automatización de Publicación
- [ ] **4.1 Batch Update Relacional:** El botón "Publicar" enviará al servidor el nuevo precio mayorista y el ID de la política aplicada, ahorrando ancho de banda y evitando inconsistencias en la base de datos.
- [ ] **4.2 Sincronización Web (Shop):** Asegurar que la tienda online use exactamente la misma lógica de "Markup" para que el cliente final siempre vea precios coherentes con la estrategia del ERP.

---

> **Ventaja Competitiva:** Con este sistema, cambiar los precios de toda la empresa ante una inflación o devaluación toma **segundos**: solo ajustas el Precio Mayorista y el sistema se encarga de re-alinear al por menor, volúmenes y créditos automáticamente.
