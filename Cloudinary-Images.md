# Guía Definitiva de Imágenes (Cloudinary) para DIROGSA

Esta guía detalla todas las imágenes necesarias para el ecosistema visual del catálogo (Katalog) y la estructura que debe respetarse en Cloudinary.

---

## 1. Reglas de Negocio Críticas

1. **NO a las imágenes genéricas de productos:** En el rubro de repuestos automotrices, el cliente usa la foto para confirmar la forma y dimensiones del filtro. **No se pondrá un "filtro falso o referencial"** si falta una foto. Si no hay foto, se mostrará claramente un logo de la empresa que indique "Imagen No Disponible".
2. **Cero subcarpetas por marca en productos:** Todos los productos van a la misma carpeta `dirogsa/products/`. El código del producto (SKU) debe ser único.
3. **Nombres de archivo:** Todo en minúsculas, sin espacios (usar guiones `-`), sin acentos.

---

## 2. Inventario de Imágenes Requeridas

A continuación, la lista exacta de archivos que debes subir a Cloudinary y sus características:

### A. Portada Principal del Catálogo (Master Cover)
*   **Nombre del archivo:** `main-cover.webp` (o `.jpg`)
*   **Ubicación en Cloudinary:** `ERP/banners/`
*   **Dimensiones / Aspect Ratio:** `2480 x 3508 px` (Formato A4 Vertical, Aspect Ratio `9:16` o `2:3` en generadores IA).
*   **Estilo Visual:** B2B Premium, Oscuro (Dark Mode), Corporativo, Iluminación de estudio.
*   **Prompt para IA (Midjourney / DALL-E):**
    > *A premium, sleek automotive B2B catalog cover background. Dark mode aesthetic. In the center, a high-quality, professional 3D render of a clean, modern automotive engine or premium air filters. Subtle neon orange and vibrant green accent lighting. Empty dark space in the center for typography. Photorealistic, 8k resolution, studio lighting, hyper-detailed, clean corporate layout --ar 2:3*

### B. Logo de la Empresa (Para Fallback y Documentos)
*   **Nombre del archivo:** `dirogsa-logo-placeholder.webp` (o `.png`)
*   **Ubicación en Cloudinary:** `ERP/brands/`
*   **Dimensiones:** `800 x 800 px` (Cuadrado).
*   **Descripción:** Tu logotipo oficial de DIROGSA (no generado por IA). Preferiblemente un vector SVG o PNG con transparencia (opacidad al 20-30%) para que funcione como marca de agua discreta cuando falten imágenes de productos.

### C. Portada de Marca (Ej: WIX Filters)
*   **Nombre del archivo:** `wix-banner.webp` (o `.jpg`)
*   **Ubicación en Cloudinary:** `ERP/brands/`
*   **Dimensiones / Aspect Ratio:** `2480 x 3508 px` (Formato A4 Vertical, Aspect Ratio `9:16` o `2:3`).
*   **Estilo Visual:** Industrial Premium, Colores corporativos de WIX (Amarillo y Negro), Oscuro.
*   **Prompt para IA (Midjourney / DALL-E):**
    > *A premium automotive background for a brand catalog. Dark industrial aesthetic with subtle yellow and black color grading. A pristine, high-tech mechanic workshop environment out of focus in the background, or close-up of a premium automotive air filter with water droplets and dramatic lighting. Dark vignette, empty space in the middle for text overlays. 8k, unreal engine 5 render, cinematic lighting --ar 2:3*

### D. Portada de Categoría (Ej: Filtros de Aire)
*   **Nombre del archivo:** `air.webp` (o `.jpg`)
*   **Ubicación en Cloudinary:** `ERP/categories/`
*   **Dimensiones / Aspect Ratio:** `2480 x 3508 px` (Formato A4 Vertical, Aspect Ratio `2:3`).
*   **Prompt para IA (Midjourney / DALL-E):**
    > *A conceptual macro photography of pure air flowing through a high-tech automotive air filter. Dark background with glowing neon particles representing clean air. Sleek, modern, engineering focus, B2B industrial catalog aesthetic. Plenty of negative dark space for text. 8k, photorealistic --ar 2:3*

### E. Productos (Filtros Específicos)
*   **Nombre del archivo:** `{SKU}.webp` (Ejemplo: `WA6162.webp`)
*   **Ubicación en Cloudinary:** `ERP/products/`
*   **Dimensiones:** `1000 x 1000 px` (Cuadrado, Aspect Ratio `1:1`).
*   **Nota:** Los productos **NO** deben generarse por IA porque engañan al cliente. Estas imágenes deben provenir de los catálogos oficiales de las marcas (fondo blanco o transparente).

---

## 3. Lógica de Resolución de Imágenes en Productos

Cuando el motor genere el PDF y busque la imagen de un filtro (Ej. SKU: WA6004), seguirá este flujo exacto:

1.  **Prioridad 1 (Base de datos local):** Verificará si el producto ya tiene un `image_url` importado desde el HTML o el ERP.
2.  **Prioridad 2 (Cloudinary Automático):** Si la BD no tiene imagen, el frontend intentará cargar dinámicamente la imagen desde Cloudinary usando tu estándar: `dirogsa/products/wa6004.webp`.
3.  **Prioridad 3 (Fallback Seguro):** Si Cloudinary responde que la imagen no existe (Error 404), el frontend capturará el error instantáneamente e inyectará el logo de `dirogsa-logo-placeholder.webp` (indicando que no hay imagen real), respetando la regla de no confundir al cliente.


## 4. Estructura Oficial de Carpetas en Cloudinary

La estructura más simple y escalable para el `ERP` es la siguiente:

```text
ERP/
├── products/
│     WA6162.webp
│     WL755.webp
│     OP575.webp
│     AP1397.webp
│
├── brands/
│     wix-logo.webp
│     wix-banner.webp
│     filtron-logo.webp
│     filtron-banner.webp
│     hengst-logo.webp
│
├── banners/
│     main-cover.webp
│     promotions.webp
│
├── categories/
│     air.webp
│     oil.webp
│     fuel.webp
│     cabin.webp
│
└── documents/
      catalog-wix.pdf
      catalog-filtron.pdf
      datasheet-WA6162.pdf
```

## 5. Convención Exacta de Nombres

| Tipo de Recurso | Formato de Nombre | Ejemplos |
| :--- | :--- | :--- |
| **Productos** | `{CODIGO_PRODUCTO}.webp` | `WA6162.webp`, `WL755.webp`, `OP575.webp` |
| **Logos de marcas** | `{marca}-logo.webp` | `wix-logo.webp`, `filtron-logo.webp`, `hengst-logo.webp` |
| **Banners de marcas** | `{marca}-banner.webp` | `wix-banner.webp`, `filtron-banner.webp` |
| **Categorías** | `{categoria}.webp` | `air.webp`, `oil.webp`, `fuel.webp` |
| **Banners del sitio** | `{nombre}.webp` | `main-cover.webp`, `promo-july.webp` |
| **Documentos** | `{nombre}.pdf` | `catalog-wix.pdf`, `datasheet-WA6162.pdf` |

> [!TIP]
> Esta estructura es limpia, predecible, fácil de mantener y suficiente para soportar un catálogo con decenas de miles de productos de manera eficiente.

## 6. Configuración Crítica de Subida (Evitar Sufijos Aleatorios)

Cloudinary por defecto añade un sufijo aleatorio al final de cada archivo (Ejemplo: `wix-logo_atsznz`) para evitar colisiones. **Esto romperá nuestro sistema** porque la base de datos espera exactamente `ERP/brands/wix-logo`.

Para solucionarlo, debes aplicar estas reglas dependiendo de cómo subas las imágenes:

### Si subes manualmente desde la web de Cloudinary:
1. Ve a **Settings** (Configuración) > **Upload**.
2. Busca la sección **Upload presets** y edita tu preset por defecto.
3. Desactiva la opción **Use random characters at the end of the public ID**.
4. Activa la opción **Overwrite**.

### Si implementas subidas desde el Backend (NestJS / FastAPI):
En el código de subida, debes pasar exactamente estos 3 parámetros:
```javascript
cloudinary.uploader.upload(file, {
  folder: "ERP/products",
  use_filename: true,
  unique_filename: false, // <-- CRÍTICO: Evita el sufijo aleatorio
  overwrite: true         // <-- Permite reemplazar la imagen con una mejor en el futuro
});
```
De esta manera garantizamos que el `public_id` sea **exactamente igual** al nombre de tu archivo, manteniendo la arquitectura 100% predecible.