# Algoritmos del Proyecto

Esta sección documenta brevemente los algoritmos clave utilizados en el sistema:

1. **Generación de Slugs URL-safe (Frontend)**
   - **Ubicación:** `src/lib/slug.js` (Función `toSlug`)
   - **Funcionamiento:** Limpia cadenas de texto (ej. quita paréntesis, reemplaza espacios por guiones) para usarlas en URLs. *Debe ser idéntico al del backend.*

2. **Motor DIMS - Alternativas Dimensionales (Backend)**
   - **Ubicación:** Llamado desde el frontend en `src/services/dims.service.js`, pero la lógica reside en el Backend (`app/engines/dims_engine.py`).
   - **Funcionamiento:** Calcula el nivel de compatibilidad (Alta, Media, Baja) y ranking de similitud entre diferentes medidas de productos.

3. **Ingesta Masiva y Laboratorio de Equivalencias (Backend/Frontend)**
   - **Ubicación:** Frontend (`src/pages/EquivalencyLaboratory.jsx`) y Backend (`app/services/dims_service.py`).
   - **Funcionamiento:** Parsea lotes de archivos JSON de la industria automotriz, extrae las especificaciones físicas, referencias OEM/Aftermarket y aplicaciones (vehículos), realizando una inyección directa (Upsert) al modelo de inventario para alimentar al Motor DIMS. Además, implementa el algoritmo de **Búsqueda Bidireccional de 360 grados** para encontrar cruces de productos (hacia adelante y hacia atrás) automáticamente.

4. **Motor de Normalización Global (Backend)**
   - **Ubicación:** Backend (`app/utils/normalization.py`).
   - **Funcionamiento:** Estandariza números de parte y marcas vehiculares interceptándolos antes de guardarse en la base de datos (eventos de Beanie/Pydantic). Elimina espacios, guiones, barras, puntos y paréntesis, transformando el texto a mayúsculas puras (`clean_code`) para permitir búsquedas exactas (O(1)) de extrema velocidad e invulnerabilidad sintáctica en cruces de catálogo.
