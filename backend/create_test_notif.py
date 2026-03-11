import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie, Document
from datetime import datetime
from typing import Optional
from pydantic import Field

class User(Document):
    full_name: str
    email: str
    class Settings:
        name = "users"

class Notification(Document):
    user_id: str
    title: str
    message: str
    type: str
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    link: Optional[str] = None
    class Settings:
        name = "notifications"

async def create_test_notif():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    await init_beanie(database=client["erp_v4"], document_models=[User, Notification])
    
    # Buscar el primer usuario
    user = await User.find_one({})
    if user:
        print(f"Creando notificación para: {user.full_name} ({user.id})")
        notif = Notification(
            user_id=str(user.id),
            title="🎯 ¡Nueva Función Activa!",
            message="Ahora puedes recibir avisos sobre tus pedidos y crédito en tiempo real. ¡Bienvenido!",
            type="INFO"
        )
        await notif.insert()
        print("Notificación creada con éxito.")
    else:
        print("No se encontraron usuarios.")

if __name__ == "__main__":
    asyncio.run(create_test_notif())
