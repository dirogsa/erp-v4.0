import asyncio
from app.models.auth import User, UserRole
from app.services.auth_service import AuthService
from app.database import init_db
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings

async def simulate_login_and_verify():
    # Initialize DB (Beanie needs it to find users)
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    await init_beanie(database=client[settings.MONGO_DB_NAME], document_models=[User])
    
    # Try to find an admin user or create a temporary one
    user = await User.find_one(User.username == "admin")
    if not user:
        print("Admin user not found, using a mock user object")
        user = User(username="admin", email="admin@example.com", full_name="Admin", role=UserRole.SUPERADMIN)
    
    identifier = user.username if user.username else user.email
    print(f"User identifier: {identifier}")
    
    token = AuthService.create_access_token(data={"sub": identifier, "role": user.role})
    print(f"Generated Token: {token}")
    
    payload = AuthService.decode_token(token)
    print(f"Decoded Payload: {payload}")
    
    if payload:
        print("Payload OK")
        sub = payload.get("sub")
        print(f"Sub in payload: {sub}")
        
        # This is what get_current_user does
        from beanie.operators import Or
        found_user = await User.find_one(Or(User.email == sub, User.username == sub))
        if found_user:
            print(f"User found in DB: {found_user.username}")
        else:
            print("User NOT found in DB with this sub!")
    else:
        print("Payload failed decode!")

if __name__ == "__main__":
    asyncio.run(simulate_login_and_verify())
