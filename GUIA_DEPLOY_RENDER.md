# 🚀 Guía Completa: Publicar ERP en Render

Esta guía te llevará paso a paso para publicar tu sistema ERP en Render. Necesitarás crear **2 servicios**:
1. **Web Service** para el Backend (API)
2. **Static Site** para el Frontend (React)

---

## 📋 ANTES DE EMPEZAR

### Prerequisitos
- ✅ Tu código debe estar en un repositorio de GitHub
- ✅ Debes tener una cuenta en MongoDB Atlas (para la base de datos)
- ✅ Debes tener una cuenta en Render

---

## 🗄️ PASO 0: Configurar MongoDB Atlas

1. Ve a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea un cluster gratuito si no lo tienes
3. Ve a **Security → Database Access** y crea un usuario con contraseña
4. Ve a **Security → Network Access** y agrega `0.0.0.0/0` para permitir acceso desde Render
5. Ve a **Database → Connect** y copia tu **Connection String**
   - Ejemplo: `mongodb+srv://usuario:password@cluster.mongodb.net/?retryWrites=true&w=majority`

---

## 🔧 PARTE 1: PUBLICAR EL BACKEND (API)

### Paso 1: Ir al Dashboard de Render
En [https://dashboard.render.com/](https://dashboard.render.com/), selecciona:

```
🟦 Web Services
New Web Service
```

### Paso 2: Conectar tu Repositorio

1. Si es tu primera vez, conecta tu cuenta de GitHub
2. Busca tu repositorio `erp_system`
3. Haz click en **Connect**

### Paso 3: Configurar el Servicio Backend

Completa el formulario con estos datos:

| Campo | Valor |
|-------|-------|
| **Name** | `erp-backend` (o el nombre que prefieras) |
| **Region** | Elige el más cercano (ej: Oregon USA) |
| **Branch** | `main` (o tu rama principal) |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | `Free` |

### Paso 4: Variables de Entorno

Haz scroll hasta **Environment Variables** y agrega:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | Tu connection string de MongoDB Atlas |
| `MONGO_DB_NAME` | `erp_db` (o el nombre que prefieras) |
| `PORT` | `10000` (Render lo asignará automáticamente) |

> ⚠️ **IMPORTANTE**: Asegúrate de reemplazar `<password>` en tu MONGODB_URI con tu contraseña real.

### Paso 5: Crear el Servicio

1. Haz click en **Create Web Service**
2. Render comenzará a construir y desplegar tu backend
3. Espera que el estado cambie a "Live" (puede tardar 2-5 minutos)
4. Copia la URL de tu backend (ej: `https://erp-backend.onrender.com`)

### Paso 6: Verificar el Backend

Abre en tu navegador:
```
https://tu-backend-url.onrender.com/docs
```

Deberías ver la documentación de FastAPI (Swagger UI).

---

## 🎨 PARTE 2: PUBLICAR EL FRONTEND

### Paso 1: Configurar URL del Backend en el Frontend

Primero necesitas configurar la URL de tu backend en el frontend.

Actualiza el archivo `frontend/src/services/api.js` (o donde tengas configurado axios) con la URL de tu backend de Render.

### Paso 2: Crear el Servicio Frontend en Render

En [https://dashboard.render.com/](https://dashboard.render.com/), selecciona:

```
🟧 Static Sites
New Static Site
```

### Paso 3: Conectar el Mismo Repositorio

1. Busca tu repositorio `erp_system`
2. Haz click en **Connect**

### Paso 4: Configurar el Servicio Frontend

| Campo | Valor |
|-------|-------|
| **Name** | `erp-frontend` |
| **Branch** | `main` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

### Paso 5: Variables de Entorno (Opcional)

Si tienes variables de entorno para el frontend, agrégalas aquí. Por ejemplo:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://erp-backend.onrender.com` |

### Paso 6: Crear el Servicio

1. Haz click en **Create Static Site**
2. Render construirá y desplegará tu frontend
3. Espera que el estado cambie a "Live"
4. Copia la URL de tu frontend (ej: `https://erp-frontend.onrender.com`)

---

## ✅ PASO FINAL: CONFIGURAR CORS

Tu backend necesita permitir peticiones desde tu frontend.

Actualiza el archivo `backend/main.py` con la URL de tu frontend en CORS:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://erp-frontend.onrender.com"  # Agrega esta línea
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Luego haz commit y push:
```bash
git add .
git commit -m "Configure CORS for production"
git push
```

Render detectará el cambio y re-desplegará automáticamente.

---

## 🎯 RESULTADO FINAL

Tendrás 2 URLs:

1. **Backend API**: `https://erp-backend.onrender.com`
   - Documentación: `https://erp-backend.onrender.com/docs`

2. **Frontend**: `https://erp-frontend.onrender.com`
   - Aplicación web completa

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### Plan Gratuito de Render

El plan gratuito tiene limitaciones:

- ⏰ **Los servicios se "duermen" después de 15 minutos de inactividad**
- 🐌 **La primera petición después de dormir puede tardar 30-60 segundos**
- 💾 **750 horas gratuitas por mes por servicio**
- 🔄 **Autodespliega en cada push a GitHub**

### Solución para el "Estado de Dormido"

Si necesitas mantener el servicio activo:
- Usa un servicio de "ping" como [UptimeRobot](https://uptimerobot.com/) para hacer peticiones cada 10 minutos
- Considera actualizar al plan Starter ($7/mes por servicio) para tener servicio 24/7

### Monitoreo

Render proporciona:
- 📊 **Logs** en tiempo real
- 📈 **Métricas** de uso (CPU, memoria)
- 🔔 **Alertas** por email si el servicio falla

---

## 🔧 TROUBLESHOOTING

### Backend no inicia
- Verifica los logs en Render Dashboard
- Asegúrate que `MONGODB_URI` sea correcto
- Verifica que todas las dependencias estén en `requirements.txt`

### Frontend no conecta al Backend
- Verifica que la URL del backend sea correcta
- Revisa la configuración de CORS
- Abre las DevTools del navegador (F12) y mira la consola

### Error de Build
- Revisa los Build Logs en Render
- Asegúrate que los comandos de build sean correctos
- Verifica que todos los archivos necesarios estén en GitHub

---

## 📚 RECURSOS ADICIONALES

- [Documentación de Render](https://render.com/docs)
- [Deploy FastAPI en Render](https://render.com/docs/deploy-fastapi)
- [Deploy React en Render](https://render.com/docs/deploy-create-react-app)

---

## 🆘 NECESITAS AYUDA?

Si tienes problemas:
1. Revisa los logs en Render Dashboard
2. Verifica las variables de entorno
3. Consulta la documentación oficial
