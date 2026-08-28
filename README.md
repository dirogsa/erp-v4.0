# Arquitectura: Motores Propietarios y Utilidades

Esta sección documenta la lógica de negocio propia del sistema, sus algoritmos nucleares y las utilidades compartidas.

---

## Motores Propietarios

### 1. Motor DIMS — Alternativas Dimensionales (Backend)
- **Ubicación:** `backend/app/engines/dims_engine.py`. Llamado desde el frontend en `frontend-web/src/services/dims.service.js`.
- **Funcionamiento:** Calcula el nivel de compatibilidad (Alta, Media, Baja) y el ranking de similitud entre las medidas físicas de diferentes productos (diámetros, alturas). Permite al cliente encontrar alternativas válidas cuando un repuesto exacto no está disponible.

### 2. Motor de Ingesta y Equivalencias — Laboratorio (Backend/Frontend)
- **Ubicación:** Frontend (`frontend-erp/src/pages/EquivalencyLaboratory.jsx`) y Backend (`backend/app/services/dims_service.py`).
- **Funcionamiento:** Parsea lotes de archivos JSON de la industria automotriz, extrae especificaciones físicas, referencias OEM/Aftermarket y aplicaciones vehiculares. Realiza una inyección directa (Upsert) al modelo de inventario. Implementa **Búsqueda Bidireccional de 360 grados**: encuentra cruces de productos hacia adelante (A→B) y hacia atrás (B→A) automáticamente.

### 3. Motor de Normalización Global (Backend)
- **Ubicación:** `backend/app/utils/normalization.py`. Se activa mediante eventos `pre_save` de Beanie en los modelos de Inventario.
- **Funcionamiento:** Estandariza números de parte y marcas vehiculares *antes* de persistirlos en MongoDB. Elimina espacios, guiones, barras, puntos y paréntesis, transformando el texto a mayúsculas puras (`clean_code`). Garantiza búsquedas exactas de velocidad O(1) e invulnerabilidad sintáctica ante variaciones de formato en cruces de catálogo.

---

## Utilidades Compartidas

### Generación de Slugs URL-safe (Frontend)
- **Ubicación:** `frontend-web/src/lib/slug.js` (Función `toSlug`).
- **Funcionamiento:** Limpia cadenas de texto (quita paréntesis, reemplaza espacios por guiones) para construir URLs SEO-friendly. La implementación debe mantenerse idéntica a la del backend para evitar discrepancias en rutas generadas.

---

## Arquitectura de Autenticación (Contrato Compartido)

Todos los portales (Web B2B y ERP Interno) se autentican contra el mismo backend (`POST /auth/login`, `GET /auth/me`).

**Patrón Estricto (Servicios y UI):**
1. **Lógica Aislada:** La UI nunca hace peticiones HTTP directas. Todo formulario llama a su `auth.service.js` (o AuthContext), encargado de validar roles, errores de red y persistir tokens.
2. **Prevención de Sobrecarga (Loading State):** La UI es responsable de manejar un estado local `loading` (booleano) que deshabilita los botones de acción (Ej. `disabled={loading}`) e indica visualmente el proceso ("Verificando..."). Esto previene el doble-click accidental y la sobrecarga de peticiones al backend.

