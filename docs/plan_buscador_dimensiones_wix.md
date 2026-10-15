# Plan Maestro: Buscador por Dimensiones y Formas (Estilo WIX Filters Europe / MANN+HUMMEL)

> **Estado**: Propuesta de Arquitectura y Especificación Técnica (SIN CAMBIOS EN CÓDIGO - Esperando Aprobación).  
> **Referencia directa**: [WIX Filters Europe - Catalog Finder](https://www.wixfilters.com/en-eu/catalog.html)

---

## 1. Análisis de Referencia: ¿Cómo funciona WIX Filters Europe?

En el catálogo de **WIX Filters Europe**, la pestaña **Dimensions** funciona como un **buscador paramétrico guiado visualmente por la morfología del filtro**:

### 1.1 Filtros y Parámetros Clave
1. **Filter Type (Tipo de Filtro)**:
   - *Air Filter* (Filtro de Aire)
   - *Oil Filter* (Filtro de Aceite)
   - *Fuel Filter* (Filtro de Combustible)
   - *Cabin Air Filter* (Filtro de Cabina)
   - *Compressed air-oil separation* (Separador aire/aceite)
   - *Air dryer cartridge* (Cartucho secador)
   - *Cooling liquid* (Líquido refrigerante)
   - *Urea Filter* (Filtro de Urea/AdBlue)

2. **Filter Shape (Forma Geométrica del Filtro)**:
   - `flat` (Plano / Panel - típico en aire y cabina)
   - `round` (Cilíndrico / Cartucho redondo)
   - `oval` (Ovalado / Elíptico)

3. **Parámetros Dimensionales Normalizados (Norma ISO/DIN Automotriz)**:
   - **A**: *Outer diameter / Length (mm)* — Diámetro exterior (si es redondo) o Longitud/Largo (si es plano/panel).
   - **B**: *Inner diameter at the top / Width (mm)* — Diámetro interior superior (redondo) o Ancho (panel).
   - **C**: *Inner diameter at the bottom (mm)* — Diámetro interior inferior (filtros cónicos o de doble boca).
   - **D**: *Largest diameter (mm)* — Diámetro exterior máximo / pestaña.
   - **E**: *Inner width (oval) (mm)* — Ancho interior para filtros ovalados.
   - **F / G**: *Inlet / thread size* — Rosca / Paso de rosca o diámetro de pico de entrada (ej: `3/4-16 UNF`, `M20x1.5`, `155.000 mm`).
   - **H**: *Height (mm)* — Altura total.

4. **Tolerancias de Búsqueda Seleccionables por Dimensión**:
   - Cada cota numérica (**A, B, C, D, E, H**) permite al usuario definir su propia tolerancia:
     - `Exacta (+/- 0 mm)` *(o valor base)*
     - `+/- 2 mm`
     - `+/- 5 mm`
     - `+/- 15 mm`
     - `+/- 20 mm`

5. **Guía Visual / Diagrama Dinámico**:
   - Al seleccionar la forma (`flat`, `round`, `oval`), el plano técnico/esquema cambia dinámicamente mostrando claramente dónde se miden `A`, `B`, `C`, `H` para evitar errores de medición.

---

## 2. Diagnóstico del Sistema Actual de DIROGSA: ¿Qué tenemos y qué falta?

### 2.1 Lo que ya existe en el proyecto
| Componente | Estado Actual | Observaciones |
| :--- | :--- | :--- |
| **Normalización de Letras** | ✅ Existe en `dims_engine.py` | Ya mapea `ALTURA` -> `H`, `DIAMETRO EXT` -> `A`, etc. |
| **Colección de Productos** | ✅ Existe `specs` en `Product` | Soporta `label`, `value`, `value_num` (en mm) y `measure_type`. |
| **Parser WIX** | ✅ Existe en `frontend-erp/.../wix.js` | Ya extrae cotas estándar `A, B, C, D, H` desde el catálogo de WIX. |
| **Pestaña DIMENSIONS en Web** | ⚠️ En desarrollo | Actualmente en `SearchModule.jsx` dice: *"Búsqueda por medidas en desarrollo..."*. |
| **Endpoint Backend** | ⚠️ Parcial | `GET /shop/products` tiene `spec_h`, `spec_d`, `spec_t`, `spec_id` con tolerancia fija de `+/- 0.5mm`. No soporta `shape`, tolerancias dinámicas (2, 5, 15, 20mm), ni cotas `C, D, E`. |
| **Campo Shape en Productos** | ⚠️ Incompleto | El modelo `Product` tiene `shape: Optional[str]`, pero muchos productos no lo tienen normalizado (`flat`, `round`, `oval`). |

---

## 3. ¿Qué valores y campos necesita incorporar el sistema?

Para que DIROGSA funcione con la misma potencia y precisión que WIX Europe, se requieren incorporar los siguientes valores:

### 3.1 En el Modelo de Datos (`Product` y `DimsReferenceProduct`)
1. **`shape` normalizado**:
   - Enum: `FLAT` (Plano), `ROUND` (Redondo/Cilíndrico), `OVAL` (Ovalado), `OTHER` (Especial).
2. **Dimensiones ISO estandarizadas en `specs`**:
   - Asegurar que todo producto tenga en su lista de `specs` los códigos:
     - `A`: Longitud exterior o Diámetro exterior (numérico en mm en `value_num`).
     - `B`: Ancho exterior o Diámetro interior superior (numérico en mm en `value_num`).
     - `C`: Diámetro interior inferior (numérico en mm en `value_num`).
     - `D`: Diámetro exterior máximo / collarín (numérico en mm en `value_num`).
     - `E`: Ancho interior en ovalados (numérico en mm en `value_num`).
     - `F` / `G`: Rosca / Conector de entrada (texto / mm).
     - `H`: Altura (numérico en mm en `value_num`).

---

## 4. Plan de Implementación por Fases

### Fase 1: Backend & Motor de Búsqueda Paramétrica
- **Ruta**: `GET /shop/products` (extensión) o `GET /api/v1/dims/search`
- **Parámetros recibidos**:
  - `category` (ej: "FILTRO DE AIRE")
  - `shape` (ej: "flat", "round", "oval")
  - `dim_a`, `tol_a` (ej: `dim_a=210`, `tol_a=5` -> busca entre 205mm y 215mm)
  - `dim_b`, `tol_b`
  - `dim_c`, `tol_c`
  - `dim_d`, `tol_d`
  - `dim_e`, `tol_e`
  - `dim_h`, `tol_h`
  - `thread` (ej: "3/4-16" o lista desplegable)
- **Construcción de Query MongoDB / Beanie**:
  - Construcción dinámica de `$elemMatch` sobre `specs` usando `value_num: { $gte: val - tol, $lte: val + tol }`.
  - Si se especifica `shape`, se filtra por `shape: shape`.

### Fase 2: Componente Frontend (UI/UX Idéntico a WIX)
- En `frontend-web/src/components/SearchModule.jsx` y nueva página de catálogo:
  1. **Selector de Tipo de Filtro**: Botones interactivos con iconos (Aire, Aceite, Combustible, Cabina, etc.).
  2. **Selector de Forma (Shape)**: 3 botones visuales con pictogramas:
     - Plano (`flat`)
     - Cilíndrico (`round`)
     - Ovalado (`oval`)
  3. **Ilustración Dinámica (Plano Técnico interactivo)**:
     - Un gráfico SVG limpio donde al pasar el mouse por el campo `A` se ilumina la cota `A` en el dibujo; igual para `B`, `C` y `H`.
  4. **Matriz de Inputs con Tolerancia Dropdown**:
     - Cada fila contiene: `[ Etiqueta Cota ]` | `[ Input mm ]` | `[ Selector +/- Tol (0, 2, 5, 15, 20 mm) ]`.
     - Para rosca `F/G`, un selector o autocomplete de pasos comunes (`M20x1.5`, `3/4"-16 UNF`, `1"-12`, etc.).

### Fase 3: Visualización de Resultados
- Mostrar las tarjetas de producto con:
  - Miniatura del producto y plano técnico.
  - Tabla comparativa lado a lado: **Medida Buscada** vs. **Medida Real del Filtro** (marcando en verde si coincide exacto, o en amarillo/naranja la diferencia en mm).
  - Estado de stock y compatibilidades directas.

### Fase 4: Enriquecimiento de Datos Existentes
- Script de retrocompatibilidad que analice los productos ya registrados en DIROGSA:
  - Si un producto de aire tiene `A` y `B` pero no `C`, clasificarlo automáticamente como `FLAT` o `PANEL`.
  - Si tiene `A` y `H` pero no `B`, clasificarlo como `ROUND` cilíndrico sellado.
  - Asegurar que `value_num` esté poblado para todas las cotas numéricas.

---

## 5. Resumen de Valores Requeridos

| Campo Requerido | Tipo de Dato | Opciones / Formato | Uso |
| :--- | :--- | :--- | :--- |
| **`filter_type`** | String / Categoría | Aire, Aceite, Combustible, Cabina, etc. | Filtro primario de categoría |
| **`shape`** | String / Enum | `flat`, `round`, `oval` | Define el esquema dimensional a solicitar |
| **`A (Length / Outer Dia)`** | Float + Tolerancia | Valor en mm, Tol: 0, 2, 5, 15, 20 mm | Cota principal de tamaño |
| **`B (Width / Inner Dia Top)`**| Float + Tolerancia | Valor en mm, Tol: 0, 2, 5, 15, 20 mm | Cota secundaria de cavidad |
| **`C (Inner Dia Bottom)`** | Float + Tolerancia | Valor en mm, Tol: 0, 2, 5, 15, 20 mm | Cota de base (para cónicos) |
| **`D (Largest Dia)`** | Float + Tolerancia | Valor en mm, Tol: 0, 2, 5, 15, 20 mm | Cota exterior máxima / pestaña |
| **`E (Inner Width Oval)`** | Float + Tolerancia | Valor en mm, Tol: 0, 2, 5, 15, 20 mm | Específico para filtros ovalados |
| **`F / G (Thread / Inlet)`** | String | Texto o mm (ej: `3/4-16`, `M20x1.5`) | Rosca de conexión |
| **`H (Height)`** | Float + Tolerancia | Valor en mm, Tol: 0, 2, 5, 15, 20 mm | Altura total |
