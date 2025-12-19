d:\Projects > netstat -ano | findstr LISTENING
d:\Projects > tasklist /FI "PID eq 7136" /FO TABLE
d:\Projects > tasklist /FI "PID eq 14896" /FO TABLE

taskkill /PID 7136 /F

D:\Projects\erp-v3.0\frontend\src\components\common\receipt\ReceiptHeader.jsx
datos de la empresa


PS D:\Projects> taskkill /PID 7136 /F
SUCCESS: The process with PID 7136 has been terminated.


### 1. Iniciar el Backend

```bash
# Navegar al directorio del backend
cd d:\Projects\erp_system\backend

# Activar el entorno virtual (si no está activado)
venv\Scripts\activate

# Iniciar el servidor de desarrollo
venv\Scripts\python -m uvicorn main:app --reload
```


### 2. Iniciar el Frontend

```bash
# Navegar al directorio del frontend
cd d:\Projects\erp_system\frontend

# Iniciar el servidor de desarrollo
npm.cmd run dev
```

1. Eliminar el entorno virtual dañado
Ejecuta este comando para borrar la carpeta venv actual por completo:

cmd
rmdir /s /q venv
2. Crear el nuevo entorno virtual
Crea un entorno limpio desde cero:

cmd
python -m venv venv
3. Activar el entorno
Actívalo para que los siguientes comandos se ejecuten dentro de él:

cmd
venv\Scripts\activate
4. Actualizar PIP (Recomendado)
Asegúrate de que el gestor de paquetes esté al día:

cmd
python -m pip install --upgrade pip
5. Instalar las dependencias
Ahora instala todo lo que el proyecto necesita (esto instalará python-jose correctamente en la nueva ruta):

cmd
pip install -r requirements.txt
6. Ejecutar el servidor
Finalmente, arranca el backend:

cmd
python -m uvicorn main:app --reload
