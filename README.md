# ERP System

Sistema de gestión empresarial (ERP) completo con módulos de inventario, ventas, compras, clientes y proveedores.

## 🚀 Características

- **Inventario**: Gestión de productos, categorías, mermas y transferencias
- **Ventas**: Órdenes de venta, facturación, pagos y guías de despacho
- **Compras**: Órdenes de compra, facturación de proveedores y recepción
- **Clientes**: Gestión de clientes con múltiples sucursales
- **Proveedores**: Gestión de proveedores y contactos
- **Importar/Exportar**: Importación masiva de productos vía CSV/Excel

## 🛠️ Tecnologías

### Backend
- **FastAPI** - Framework web moderno y rápido
- **MongoDB** - Base de datos NoSQL
- **Beanie** - ODM para MongoDB
- **Motor** - Driver asíncrono de MongoDB
- **Python 3.11+**

### Frontend
- **React** - Biblioteca UI
- **React Router** - Enrutamiento
- **Vite** - Herramienta de construcción
- **Axios** - Cliente HTTP

## 📋 Requisitos Previos

- Python 3.11 o superior
- Node.js 18 o superior
- MongoDB Atlas account (o MongoDB local)

## ⚙️ Configuración

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/erp_system.git
cd erp_system
```

### 2. Configurar Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# En Windows:
venv\Scripts\activate
# En Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de MongoDB
```

**⚠️ IMPORTANTE**: Edita el archivo `.env` con tus credenciales reales de MongoDB:
```
MONGODB_URI=mongodb+srv://tu_usuario:tu_password@tu_cluster.mongodb.net/?retryWrites=true&w=majority
MONGO_DB_NAME=nombre_de_tu_base_de_datos
```

### 3. Configurar Frontend

```bash
cd frontend

# Instalar dependencias
npm install
```

## 🚀 Ejecutar la Aplicación

### Backend

```bash
cd backend
# Con entorno virtual activado
uvicorn main:app --reload
```

El backend estará disponible en: `http://localhost:8000`
- Documentación API: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm run dev
```

El frontend estará disponible en: `http://localhost:5173`

## 📁 Estructura del Proyecto

```
erp_system/
├── backend/
│   ├── app/
│   │   ├── models/          # Modelos de datos
│   │   ├── services/        # Lógica de negocio
│   │   ├── routes/          # Endpoints API
│   │   ├── schemas/         # Esquemas Pydantic
│   │   └── exceptions/      # Excepciones personalizadas
│   ├── .env.example         # Plantilla de variables de entorno
│   ├── main.py              # Punto de entrada del backend
│   └── requirements.txt     # Dependencias Python
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── pages/           # Páginas principales
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # Servicios API
│   │   └── utils/           # Utilidades
│   ├── package.json         # Dependencias Node
│   └── vite.config.js       # Configuración Vite
└── README.md
```

## 🔒 Seguridad

- **NUNCA** subas el archivo `.env` al repositorio
- El archivo `.env.example` es solo una plantilla
- Mantén tus credenciales de MongoDB seguras
- Usa diferentes credenciales para desarrollo y producción

## 📝 Licencia

Este proyecto es privado y confidencial.

## 🤝 Contribuir

Este es un proyecto privado. Para contribuir, contacta al administrador del repositorio.

## 📧 Contacto

Para soporte o consultas, contacta al equipo de desarrollo.
