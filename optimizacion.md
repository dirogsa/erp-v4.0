# Plan de Implementación: Búsqueda Inteligente de Productos (Auto-Lookup)

Este plan describe cómo automatizar el llenado de fichas técnicas simplemente ingresando el código (SKU) del producto, utilizando el Backend como motor de búsqueda y extracción.

---

## 🏗️ 1. Arquitectura del Sistema (Flujo de Datos)

Para evitar bloqueos de seguridad del navegador (CORS), utilizaremos el siguiente flujo:

1. **Usuario:** Ingresa un código en el campo SKU (ej. `WA6214`) y presiona el botón **🔍 Buscar**.
2. **Frontend (React):** Realiza una petición `GET` a nuestro propio servidor: `/api/inventory/external-lookup?sku=WA6214`.
3. **Backend (Python/FastAPI):**
    - Se conecta a la web oficial (Wix o Filtron) simulando una búsqueda.
    - Captura el HTML resultante de la ficha técnica.
    - Devuelve este HTML crudo al Frontend.
4. **Frontend (React):** 
    - Recibe el HTML.
    - Utiliza la función existente `parseCatalogHtml` para extraer: **EAN, Medidas, Aplicaciones y Galería de imágenes**.
    - Actualiza los campos del formulario automáticamente.

---

## ⚙️ 2. Detalles Técnicos por Capa

### A. Backend (Logística de Búsqueda)
Se creará un nuevo servicio en `backend/app/services/catalog_service.py` que:
- Detecte el patrón del código (Ej: si empieza con `WA` es Wix, si es solo números/prefijos conocidos es Filtron).
- Realice una petición `POST` o `GET` a la URL del catálogo correspondiente.
- Implemente un **User-Agent** profesional para evitar ser detectado como bot básico.

### B. Frontend (Mejora de UX en `ProductForm.jsx`)
- **Nuevo Botón:** Al lado del campo SKU, se añadirá un botón circular con un icono de lupa (🔍).
- **Estado de Carga:** El botón cambiará a un "loading" mientras el backend hace la consulta.
- **Auto-Llenado Inteligente:** Si el usuario ya escribió algo manualmente, el sistema preguntará si desea sobrescribir los datos con la información oficial encontrada.

---

## 🎯 3. Beneficios y Escalabilidad

- **Cero Errores Manuales:** Se eliminan errores de dedo al transcribir medidas o aplicaciones.
- **Velocidad:** Crear un producto nuevo pasará de tomar 5 minutos a solo **10 segundos**.
- **Independencia de Archivos:** Ya no será necesario descargar y subir archivos `.html` manualmente, aunque la opción seguirá disponible como respaldo.
- **Soporte Multi-Marca:** El sistema será capaz de identificar y buscar en diferentes fuentes según el formato del código ingresado.

---

## 🚀 Próximos Pasos (Tras aprobación)
1. Implementar el endpoint `/external-lookup` en el backend.
2. Conectar el botón de búsqueda en `ProductForm.jsx`.
3. Validar la extracción de imágenes directamente desde las URLs oficiales.
