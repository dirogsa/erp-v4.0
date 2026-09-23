Plan Integral de Refactorización de Búsqueda
Esta es una auditoría completa del sistema de búsqueda end-to-end (Frontend → API → DB), con todos los problemas encontrados y el plan de ataque correcto.

Estado Actual
El motor $search de Atlas ya está integrado para búsquedas de tipo "CODES". Sin embargo, al analizar todos los demás puntos del sistema, se identificaron problemas adicionales que deben resolverse para tener una solución verdaderamente integral y sin deuda técnica.

Problemas Identificados
🔴 CRÍTICO — Problema 1: El endpoint de búsqueda de equivalencias (mode=equivalence) usa $regex sin índice
Archivo: backend/app/routes/shop.py L:484

python

# Actual — COLLSCAN: lee TODA la tabla en cada búsqueda
query["equivalences.code"] = {"$regex": f"^{s}", "$options": "i"}
El clean_code ya existe en los documentos para este propósito exacto. La búsqueda de equivalencias debería también pasar por Atlas Search usando el campo indexado.

Fix: Unificar con el pipeline de Atlas. Cuando mode == "equivalence", usar $search con path equivalences.code.

🔴 CRÍTICO — Problema 2: El endpoint de detalle de producto (GET /shop/products/{sku}) usa $regex
Archivo: backend/app/routes/shop.py L:658

python

# Actual — $regex en el campo más caliente de toda la API (página de producto)
p = await Product.find_one({
    "sku": {"$regex": f"^{re.escape(sku)}$", "$options": "i"},
    ...
})
Esta ruta se llama en cada visita a una página de producto. El campo sku ya tiene un índice Indexed(str) en el modelo, pero el $regex lo ignora y hace un COLLSCAN. Debería buscar por sku_canonical (que ya existe y almacena el SKU limpio en minúsculas).

Fix: Usar Product.find_one({"sku_canonical": clean_code(sku)}) directamente sobre el campo indexado.

🟡 IMPORTANTE — Problema 3: El product.service.js no pasa el parámetro mode a la API
Archivo: frontend-web/src/services/product.service.js L:107

El servicio no expone el parámetro mode. Cuando el usuario busca por código de equivalencia (ej: un OEM de Toyota), el backend nunca sabe si debe buscar en equivalences.code o en sku. Los tres modos del backend (all, vehicle, equivalence, specs) son ignorados.

Fix: Añadir if (params.mode) qs.set('mode', params.mode) al servicio.

🟡 IMPORTANTE — Problema 4: La página de búsqueda no distingue entre SKU exacto y equivalencias con Atlas Search
Archivo: frontend-web/src/app/search/page.js L:79

js

// Actual — Comparación exacta de strings en el frontend
exactMatches = results.filter(p => p.sku === qUpper);
equivalentMatches = results.filter(p => p.sku !== qUpper);
Con Atlas Search, el backend ya devuelve resultados rankeados por relevancia. Pero el frontend asume que solo existe coincidencia exacta si p.sku === query.

El problema: si el usuario busca OE32006, el backend puede devolver un producto cuyo sku es OE32006 y otro donde ese código aparece en equivalences. La lógica del frontend no puede distinguirlos, ya que matched_equivalence ya viene en la respuesta API pero el normalizeProduct lo descarta.

Fix: Incluir matched_equivalence en normalizeProduct() y usarlo en search/page.js para clasificar correctamente exact vs. equivalents.

🟡 IMPORTANTE — Problema 5: El campo matched_equivalence en la respuesta API es ineficiente
Archivo: backend/app/routes/shop.py L:626

python

# Actual — Itera por Python sobre todos los equivalentes de cada producto
matched_equivalence=next((eq.code for eq in p.equivalences if search and search.strip().upper() in eq.code.upper()), None)
Esto se ejecuta en Python para cada producto en la lista de resultados. Con Atlas Search, el propio pipeline puede añadir un campo highlight o simplemente retornar el score. Es una duplicación de trabajo.

Fix: Añadir etapa $addFields en el pipeline de Atlas para marcar si el match fue por equivalencia, en lugar de hacerlo en Python post-query.

🟢 MENOR — Problema 6: El endpoint /predictive-order tiene referencias a campos obsoletos
Archivo: backend/app/routes/shop.py L:1006

python

price = p.price_list  # Este campo no existe en el modelo Product
discount_3_pct=p.discount_3_pct  # Este campo tampoco existe directamente
Esas líneas causarán un AttributeError en producción cuando se llame al endpoint de pedido predictivo. El precio debe obtenerse via PricingService igual que el resto de los endpoints.

Fix: Reemplazar p.price_list con la llamada a PricingService.get_bulk_prices().

Propuesta de Cambios (Archivos y Alcance)
Backend: shop.py
[MODIFY] L:483-485 — Modo equivalence → Atlas Search
Cambiar $regex en equivalences.code a un $search sobre el path equivalences.code dentro del pipeline de Atlas.
[MODIFY] L:656-663 — GET /shop/products/{sku} → lookup por índice
Reemplazar búsqueda con $regex por búsqueda exacta usando sku_canonical.
[MODIFY] L:624-626 — matched_equivalence → mover al pipeline
Eliminar la iteración en Python.
Añadir un $addFields en el aggregation pipeline de Atlas Search que calcule matched_equivalence en el servidor.
[MODIFY] L:1003-1013 — /predictive-order → arreglar price_list
Usar PricingService.get_bulk_prices() en lugar de p.price_list.
Frontend Web: product.service.js
[MODIFY] L:107-124 — Añadir parámetro mode
Añadir if (params.mode) qs.set('mode', params.mode) para exponer los modos de búsqueda del backend.
[MODIFY] L:231-269 — normalizeProduct → incluir matched_equivalence
Añadir el campo matchedEquivalence: p.matched_equivalence || null al objeto normalizado.
Frontend Web: search/page.js
[MODIFY] L:78-82 — Clasificación de resultados exact/equivalents
En lugar de comparar p.sku === qUpper, usar p.matchedEquivalence para identificar qué productos vienen de una coincidencia de equivalencia vs. SKU directo.
Resultado Final Esperado
Búsqueda	Ahora	Después
OE32006 (código exacto)	Error 500 / Sin resultados	✅ Resultado exacto en primera posición
32006 (parcial)	No funciona	✅ Atlas Fuzzy Search lo encuentra
oe 32006 (con espacio)	No funciona	✅ Atlas lo normaliza
Equivalencia Toyota 90915-10003	Solo si es el SKU	✅ Buscado en equivalences.code vía Atlas
Página de producto /catalog/OE32006	$regex COLLSCAN	✅ Lookup por índice sku_canonical
Pedido Predictivo	AttributeError silencioso	✅ Precios via PricingService
IMPORTANT

Para que todo esto funcione, recuerda crear el índice default en MongoDB Atlas Search. Es el único paso manual requerido.

¿Apruebas este plan completo?