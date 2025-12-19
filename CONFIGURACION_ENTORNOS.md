# 🔧 Configuración para Trabajar en Localhost y Render

Tu sistema ya está **configurado para funcionar en ambos entornos automáticamente**. Aquí te explico cómo funciona:

---

## ✅ Configuración Actual (Ya Implementada)

### Frontend (`frontend/src/services/api.js`)

El código usa esta lógica:

```javascript
baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000'
```

**Significa:**
- Si existe `VITE_API_URL` (en Render) → usa esa URL
- Si NO existe (en localhost) → usa `http://localhost:8000`

### Backend (`backend/main.py`)

El CORS permite:

```python
origins = [
    "http://localhost:5173",  # Desarrollo local
    "http://localhost:3000",  # Desarrollo local
]

# Si existe FRONTEND_URL (en Render), la agrega
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)
```

---

## 🚀 Cómo Usar en Cada Entorno

### 💻 Desarrollo Local (Localhost)

**NO necesitas hacer nada especial**, simplemente:

```bash
# Terminal 1 - Backend
cd backend
venv\Scripts\activate
uvicorn main:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

El frontend automáticamente se conectará a `http://localhost:8000`.

### ☁️ Producción (Render)

**Configuración de Variables de Entorno:**

#### Backend (`erp-backend`)
```
MONGODB_URI=mongodb+srv://...tu_uri_atlas...
MONGO_DB_NAME=erp_db
FRONTEND_URL=https://erp-frontend-mwgp.onrender.com
```

#### Frontend (`erp-frontend`)
```
VITE_API_URL=https://erp-backend-6n75.onrender.com
```

---

## 📝 Opcional: Archivo .env.local para el Frontend

Si quieres ser más explícito en desarrollo, puedes crear este archivo:

**Ubicación:** `frontend/.env.local`

```env
# Desarrollo local - Backend URL
VITE_API_URL=http://localhost:8000
```

> **NOTA:** Este archivo está en `.gitignore`, así que NO se subirá a GitHub.

---

## 🔄 Flujo de Trabajo Recomendado

### 1. Desarrollar Localmente

```bash
# Trabaja en localhost como siempre
cd backend && uvicorn main:app --reload
cd frontend && npm run dev
```

### 2. Subir Cambios a GitHub

```bash
git add .
git commit -m "Descripción de cambios"
git push origin main
```

### 3. Render Auto-Despliega

Render detecta el push automáticamente y:
- ✅ Re-construye el backend
- ✅ Re-construye el frontend
- ✅ Usa las variables de entorno de producción

---

## 📋 Checklist de Verificación

### Localhost ✅
- [ ] Backend corre en `http://localhost:8000`
- [ ] Frontend corre en `http://localhost:5173`
- [ ] Frontend se conecta automáticamente al backend local
- [ ] MongoDB puede ser local o Atlas (depende de tu `.env`)

### Render ✅
- [ ] Backend: `FRONTEND_URL` configurada
- [ ] Frontend: `VITE_API_URL` configurada
- [ ] Ambos servicios en estado "Live"
- [ ] Auto-deploy activado para ambos

---

## 🎯 Resumen

**Todo ya está configurado**, solo necesitas:

1. **Desarrollo**: Trabaja normalmente en localhost
2. **Push**: Sube tus cambios a GitHub
3. **Automático**: Render se actualiza solo

No necesitas cambiar código ni configuración entre entornos. 🚀
