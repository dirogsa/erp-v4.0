# Dirogsa ERP - UI & UX Design Guidelines (Mobile First)

Este documento establece las directrices de diseño y usabilidad para el frontend móvil (`frontend-mobile`) y el panel administrativo (`frontend-erp`). La filosofía principal es el **Minimalismo Funcional**: decir más con menos.

## 1. Regla de Oro: Minimización de Texto
**El espacio en dispositivos móviles es crítico.** Los textos largos asfixian la interfaz y reducen la claridad de la información clave.
- **Evitar etiquetas de texto obvias en botones:** Si un botón hace una acción universal (Ej. "Añadir al carrito", "Buscar", "Inicio", "Filtrar"), **reemplázalo por un ícono universal**.
- **No usar verbos en elementos de navegación:** La navegación inferior (`BottomNav`) y botones de acción principal (`Call to Action`) deben depender del reconocimiento visual (íconos) antes que de la lectura (texto).
- **Iconografía Activa:** Los iconos deben tener un feedback visual claro (cambio de tamaño, color o sombra) para confirmar que el usuario interactuó con ellos.

## 2. Optimización de Espacios en Tarjetas (Cards)
- **Compactación Vertical:** Elimina los márgenes (`mt`, `mb`) excesivos. Utiliza `gap` dentro de flexboxes para mantener los elementos unidos con precisión quirúrgica.
- **Supresión de Botones Falsos:** Si toda una tarjeta es clickeable para ver un detalle, **NO pongas un botón extra** que diga "Ver Detalle". Utiliza indicadores visuales sutiles como un pequeño chevron (`>`) en una esquina.
- **Jerarquía Tipográfica Agresiva:** 
  - Títulos de producto (`line-clamp-2` o flujo libre sin `min-h`).
  - Precios (`text-brand-price`) grandes y claros.
  - Metadatos como SKUs y Puntos deben ser minúsculos (`text-[9px]` a `text-[11px]`) pero de alto contraste (`font-black uppercase tracking-widest`).

## 3. Barras de Acción Inferior (Sticky Bottom Bars)
- **Regla del 80/20 en Botones de Acción:** El control de cantidad (`Quantity Selector`) o los controles secundarios deben tomar la mayor parte del espacio (`flex-1`), mientras que el botón de acción crítico (Ej. Añadir al carrito) debe ser un botón cuadrado (`aspect-square` o `h-[64px] w-[64px]`) con un ícono enorme y vibrante, apoyado en el borde derecho.
- **Sombras de Acento (Glow):** Los botones principales deben tener una sombra del color de la marca (Ej. `shadow-[0_0_20px_rgba(16,185,129,0.4)]`) para destacar sin necesidad de texto.

## 4. Consolidación y Prevención de Desincronización
- **Filosofía de UI Optimista:** Todas las interacciones de cambio de estado (activar, ocultar, añadir) deben actualizar el estado de la UI *inmediatamente* (Optimistic UI), enviando la petición al servidor en segundo plano.
- **Herencia Automática:** Las variantes de un producto o marca siempre deben heredar automáticamente el estado visual de su entidad padre. Si se oculta el padre, se ocultan los hijos para evitar "datos fantasma" en la UI.
