# Plan de Optimización: Integración de Datos Técnicos y Mejora de UX (Filtron-Powered)

Este documento detalla la estrategia para transformar la carga de productos en un proceso semi-automático y enriquecido, utilizando la "materia prima" extraída de los catálogos técnicos de Filtron y Wix.

---

## 🔝 Fase 1: El "Cerebro" de Importación (Parser)
Desarrollar una lógica que transforme el HTML descargado en objetos JSON compatibles con el ERP.

- **Identificadores:** Extracción de SKU (OE 688) y **EAN-13** (5904608006882).
- **Dimensiones:** Mapeo automático de A, B, C, H a la tabla de `specs`.
- **Aplicaciones:** Conversión de las tablas de compatibilidad (Audi, Seat, VW) a la lista de `applications`.
- **Media:** Captura de URLs de imágenes (normal, plain, extra) y del PDF de instrucciones técnicas.

---

## ⚙️ Fase 2: Rediseño del Formulario (`ProductForm.jsx`)
Para aprovechar estos datos, el formulario debe evolucionar para recibir más información de valor.

### 2.1 Nuevos Campos y Secciones
- [ ] **Campo EAN:** Añadir un campo específico para el Código de Barras (EAN).
- [ ] **Sección de Boletín Técnico:** Crear un campo de "Aviso para Vendedores/Clientes" que almacene las notas de montaje (ej: "Asegurar que la junta esté en la ranura superior").
- [ ] **Recurso Externo PDF:** Campo para almacenar el link al manual técnico oficial del fabricante.
- [ ] **Galería Extendida:** Permitir más de una imagen (Imagen Real vs. Dibujo Técnico).

### 2.2 Mejoras de UX (Experiencia de Usuario)
- [ ] **Botón de Acción Rápida:** Colocar un botón "⚡ Importar Catálogo" en la cabecera del formulario.
- [ ] **Modo de Previsualización de Importación:** Al cargar el archivo, mostrar un resumen de lo encontrado:
    *   *Se encontraron 157 aplicaciones vehiculares.*
    *   *Se encontraron 4 medidas técnicas.*
    *   *Se encontró 1 boletín de seguridad.*
- [ ] **Auto-Categorización:** Si el HTML dice "Filtro de Aceite", el selector de categorías debe posicionarse automáticamente.

---

## 🛡️ Fase 3: Integración de Equivalencias (Cruces)
- [ ] **Sincronización de Sustitutos:** El formulario debe poder importar la lista de códigos de otras marcas (Mann, Bosch, etc.) directamente a la pestaña de `equivalences`.
- [ ] **Buscador de Equivalencias:** Implementar una lógica que permita que, si un cliente pide un MANN HU719/7x, el ERP sepa instantáneamente que es el equivalente al Filtron OE 688 importado.

---

## 🚀 Fase 4: Ventajas en el Punto de Venta (Shop & ERP)
- [ ] **Ficha Técnica Profesional:** La tienda online mostrará automáticamente el dibujo técnico y las aplicaciones que importamos, dando confianza al comprador.
- [ ] **Alerta de Instalación:** Al facturar, el sistema mostrará un pop-up con la nota técnica importada del catálogo para evitar errores del mecánico.

---

> **Estado Actual:** Planeación.
> **Próximo Paso:** Creación del script `filtronParser.js` y modificación de la estructura de datos en el Backend para aceptar EAN y Boletines Técnicos.
