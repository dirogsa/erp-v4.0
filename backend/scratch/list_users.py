
import asyncio
from app.database import init_db
from app.models.auth import User

async def list_users():
    await init_db()
    users = await User.find_all().to_list()
    for u in users:
        has_hash = "Yes" if u.password_hash else "No"
        print(f"User: {u.username} | Email: {u.email} | Hash: {has_hash} | Role: {u.role}")

if __name__ == "__main__":
    asyncio.run(list_users())
