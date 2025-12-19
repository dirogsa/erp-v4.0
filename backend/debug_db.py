import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import sys

# Force unbuffered stdout
sys.stdout.reconfigure(line_buffering=True)

load_dotenv()

async def diagnosis():
    print("--- DIAGNOSTICO DE CONEXIÓN ATLAS ---")
    mongo_url = os.getenv("MONGODB_URI")
    
    if not mongo_url:
        print("❌ Error: No se encontró MONGODB_URI en .env")
        return

    # Ocultar contraseña en el log
    masked_url = mongo_url.split('@')[-1] if '@' in mongo_url else "..."
    print(f"Buscando conectar a: ...@{masked_url}")
    
    try:
        print("Intentando conectar (Timeout 5s)...")
        # Add timeout to client
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        
        # Test connection
        print("Enviando ping...")
        await client.admin.command('ping')
        print("✅ ¡CONEXIÓN EXITOSA! El backend debería funcionar.")
        
    except Exception as e:
        print(f"❌ ERROR DE CONEXIÓN: {type(e).__name__}")
        print(f"Detalle: {e}")
        
    print("\n------------------------------------")

if __name__ == "__main__":
    asyncio.run(diagnosis())
