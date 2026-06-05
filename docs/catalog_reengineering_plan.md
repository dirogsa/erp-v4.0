# Plan de Reingeniería del Motor de Catálogo A4 (CatalogTest)

## Contexto Arquitectónico
Tras analizar las fallas de inyección de Chrome y la estructura actual del ERP, queda claro que las restricciones de impresión están siendo sobreescritas o asfixiadas por el Layout global (`.app-container`, `.main-content`, `display: flex`). Siguiendo la **CONSTITUTION.md** (Regla 6: Premium UI/UX y la política de no crear "parches"), la solución definitiva es refactorizar el renderizado del catálogo en un entorno **aislado, limpio y de una sola fuente de verdad**.

## Estrategia
Crearemos una ruta y componente completamente independientes (`CatalogTest.jsx`) que **NO estará envuelto por el `<Layout>` global del ERP**. Al escapar del árbol del DOM principal, garantizamos que las reglas flex y de la UI del sistema no interfieran con la geometría milimétrica del papel A4 que espera el navegador. Todo el motor (React + CSS inyectado) vivirá en este único archivo para una fácil auditoría y mantenimiento.

## Fases de Ejecución (Checklist)

- [x] **Fase 1: Configuración de Entorno Aislado**
  - Crear el archivo `CatalogTest.jsx`.
  - Crear una nueva ruta temporal `/catalog-test` en `App.jsx` que **NO use el componente `<Layout>`**.

- [x] **Fase 2: Estructura Base y Motor CSS (Pure Print Engine)**
  - Implementar en `CatalogTest.jsx` la inyección del `<style>` crítico (sin usar `catalog.css` ni `index.css` de manera que nos contamine).
  - Definir las dimensiones absolutas A4 milimétricas (`210mm x 297mm`) garantizando cero paddings externos.

- [x] **Fase 3: Renderizado de la Portada (Intro Page)**
  - Migrar la lógica de la portada principal (Logo, Título, Fecha).
  - Comprobar la visualización y realizar prueba de impresión aislando solo esta página.

- [ ] **Fase 4: Motor de Grilla y Tarjetas (Grid Engine)**
  - Migrar la lógica de renderizado por Categorías y Marcas.
  - Implementar el diseño exacto de las `ProductCard` de forma contenida, asegurando que su altura sumada no desborde la geometría A4.

- [ ] **Fase 5: Validación de Cross-Origin e Imágenes**
  - Asegurar la política `referrerPolicy="no-referrer"` en cada imagen para evadir el error 403 de Scene7.

- [ ] **Fase 6: Prueba Final y Reemplazo**
  - Imprimir desde Chrome en modo "Portrait" y "Landscape" verificando el match perfecto (1 hoja virtual = 1 hoja impresa).
  - Si el resultado es de "Clase Mundial", reemplazar el archivo original `CatalogView.jsx` con el nuevo código y eliminar el test.

---
*Este documento guiará nuestra reconstrucción paso a paso. Se actualizará el checklist conforme avancemos en cada fase.*
