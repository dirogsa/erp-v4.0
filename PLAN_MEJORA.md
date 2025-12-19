# Plan Maestro: Ecosistema ERP & E-commerce B2B/B2C v2.0

Como Arquitecto de Software Senior, he diseñado este plan para transformar tu sistema actual en una plataforma robusta, escalable y profesional, siguiendo los estándares de las grandes cadenas de retail (estilo Amazon/Sodimac) pero con el control B2B que tu negocio necesita.

---

## 🏛️ Arquitectura: "One Brain, Multiple Faces"

Mantendremos un **Backend Único** que servirá a ambos frontends. Esto garantiza que el stock y los precios sean siempre consistentes.

### Estructura de Carpetas Sugerida:
- `backend/` (FastAPI + MongoDB) -> **Mantenemos y mejoramos.**
- `frontend-erp/` (React + CSS/Vite) -> **Tu sistema actual.**
- `frontend-shop/` (React + Tailwind + Heroicons) -> **La nueva tienda online.**

---

## 🎯 Fase 1: Backend "Shared & Secure" (El Cerebro)

El ERP seguirá siendo libre en tu red local, pero el Backend debe prepararse para la exposición web.

### 1.1 Sistema de Identidad Global (Auth)
- **JWT (JSON Web Tokens)**: Implementar autenticación persistente.
- **Roles y Permisos**:
  - `ADMIN`: Acceso total (ERP).
  - `STAFF`: Acceso limitado (Vendedores).
  - `CUSTOMER_B2C`: Persona natural (tienda).
  - `CUSTOMER_B2B`: Empresas con precios especiales (aprobadas).

### 1.2 Motor de Precios Dinámico
- Crear lógica en el backend para que, según el RUC del usuario logeado, el endpoint de productos devuelva un precio diferente o un descuento porcentual aplicado.

### 1.3 Módulo de Solicitudes B2B
- Nuevo modelo `B2BApplication`:
  - Almacena RUC, Razón Social, Ficha RUC (PDF/Link) y datos de contacto.
  - Estado: `PENDING`, `APPROVED`, `REJECTED`.
  - El Admin (tú) ve estas solicitudes en el ERP y al dar "Aceptar", el usuario se convierte en `CUSTOMER_B2B`.

---

## 🎨 Fase 2: `frontend-shop` Ultra-Profesional

Usaremos **Tailwind CSS** para un diseño moderno y **Heroicons** para una iconografía premium.

### 2.1 Diseño de UX "Retail Hero"
- **Navegación Anónima**: El cliente puede navegar, filtrar por categoría/marca y ver fotos sin logearse.
- **Visualización de Filtros**: Buscador inteligente que filtre por aplicación (Carro, Año, Motor).
- **Catálogo Dinámico**: Cards de productos con efectos hover, lazy loading de imágenes y badges de "Novedad".

### 2.2 Pantallas Reutilizables y Componentes:
- **ProductGrid**: Reutilizable para "Novedades" y "Resultados de búsqueda".
- **SidebarFilters**: Sistema de filtros facetados (checkboxes de marcas, tipos, etc.).
- **Header**: Barra de búsqueda central y acceso a cuenta.

---

## 🛒 Fase 3: Flujo de Compra y "Gatekeeping"

Copiando el flujo de las grandes tiendas:

1. **Añadir al Carrito**: Libre para todos.
2. **Revisar Carrito**: Libre.
3. **Checkout (Ir a Cotizar)**: 
   - Aquí aparece el **"Muro de Autenticación"**.
   - Si no está logeado: "Inicia sesión para finalizar tu pedido".
   - **B2C**: Se registra y termina.
   - **B2B**: Si ya es cliente aprobado, ve sus descuentos. Si no, se le invita a "Solicitar Cuenta Empresa".

---

## 🏗️ Fase 4: Control B2B y Gestión

### 4.1 Dashboard del Administrador (En el ERP)
- Nueva pestaña: **"Gestión de Tienda"**.
- Lista de solicitudes B2B entrantes.
- Configuración de descuentos por grupo de RUC (Ej: RUCs de construcción -> 10% desc en filtros de aire).

---

## 🛡️ Respuesta a tu Pregunta Técnica: Renombrar `frontend`

**¿Habrá conflictos?**
No habrá conflictos graves de código, pero sí de entorno. 

**Qué debes cambiar si renombras:**
1. **Terminales**: Tendrás que cerrar las terminales actuales y entrar con `cd frontend-erp`.
2. **Scripts**: Si tienes algún script en el `package.json` de la raíz o archivos de despliegue que digan "frontend", habrá que cambiarlos.
3. **Rutas**: En React, las rutas son relativas al dominio, así que no afectará el `navigate()` ni los `imports` internos.

**Veredicto**: Es **seguro** hacerlo. Te recomiendo renombrarlo ahora mismo para que la estructura quede limpia desde el inicio.

---

## 🔐 Fase 1.1: Autenticación con Aislamiento Total (B2C vs B2B)

Para garantizar que los beneficios de empresa no se filtren a cuentas personales, implementaremos una **Arquitectura de Identidad Separada**:

### 1.1.1 Usuarios B2C (Personas Naturales)
- **Acceso**: Login Rápido (Google / Email).
- **Trato**: Precios de lista, promociones retail.
- **Auto-registro**: Inmediato.

### 1.1.2 Usuarios B2B (Empresas - Acceso Restringido)
- **Acceso**: Únicamente mediante **Usuario y Contraseña exclusivos** emitidos por el administrador.
- **Sin Vinculación Personal**: No se hereda el acceso de una cuenta personal. La cuenta de empresa es una entidad independiente.
- **Flujo de Alta**:
    1.  **Solicitud**: El interesado llena un formulario público: "Solicitar Cuenta Mayorista".
    2.  **Datos Clave**: RUC, Razón Social, **Correo Corporativo de la Empresa**, Contacto.
    3.  **Revisión Admin (ERP)**: Tú recibes la ficha técnica y decides si califica.
    4.  **Generación de Credenciales**: Al dar "Aprobar", el sistema:
        - Crea un nuevo usuario con rol `B2B`.
        - Genera una contraseña segura temporal.
        - Envía un correo formal a la **dirección corporativa** con las instrucciones de acceso.

---

## 🏁 Fase 3: El "Embudo de Ventas" Corporativo

Implementaremos el flujo de las grandes distribuidoras para captar prospectos:

1.  **Navegación**: El usuario ve precios normales.
2.  **Gancho B2B**: En cada producto y en el carrito aparecerá: 
    > "¿Eres distribuidor o empresa del sector? [Haz clic aquí para solicitar precios al por mayor]".
3.  **Muro de Pago (Checkout)**:
    - Si el usuario es **B2C/Anónimo**: Paga precio normal.
    - Si el usuario quiere **Beneficios B2B**: Debe cerrar sesión e ingresar con las credenciales que tú le enviaste previamente por correo.

---

## 📋 Checklist Técnico Actualizado

### Backend (Seguridad & Workflow)
- [ ] **Dual Auth Logic**: Soporte para OAuth2 (Google) y credenciales internas (Bcrypt).
- [ ] **B2B Management System**: 
  - Modelo de `Applications` con adjuntos.
  - Lógica de "Promoción de Cuenta": Función que crea el usuario B2B tras la aprobación.
  - Servicio de Correo (SMTP): Para el envío automatizado de las credenciales generadas.

### Frontend Shop
- [ ] **Formulario de Registro B2B**: Captura de datos avanzada (RUC, Ficha RUC).
- [ ] **Identificador de Sesión**: Mostrar claramente si estás logeado como "Persona" o "Empresa".
- [ ] **Precios Condicionales**: `if (user.role === 'B2B') showSpecialPrice()`.

---

## 🏗️ Checklist de Estructura de Proyecto (Roadmap)

### Fase 0: Limpieza
- [x] Renombrar carpeta `frontend` -> `frontend-erp`.

### Fase 1: Backend Setup & Auth
- [ ] Implementar login seguro y encriptado.
- [ ] Crear el "Buzón de Solicitudes B2B" accesible desde el ERP.

### Fase 2: Tienda Online (Tailwind + Heroicons)
- [ ] Landing page y Catálogo responsivo.
- [ ] Implementar el "Auth Wall" en el carrito.

---

## 🚀 Opinión de Arquitecto

Como mejora adicional, sugiero que el **ERP** (frontend-erp) también use este sistema de login si decides subirlo a la nube en el futuro. Por ahora, el ERP puede seguir "libre", pero el Backend ya estará preparado para exigir usuario y contraseña si alguien intenta acceder desde fuera de tu red.

**¿Empezamos con el renombrado de carpetas y el setup del Backend?**
