import asyncio
import os
import sys
from dotenv import load_dotenv

# Get the script's directory and the backend directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)  # Go up from scripts/ to backend/

# Add backend to Python path
sys.path.insert(0, BACKEND_DIR)

# Load environment variables from backend/.env
load_dotenv(os.path.join(BACKEND_DIR, '.env'))

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import bcrypt

from app.models.auth import User, UserRole
from app.database import init_db

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def create_superadmin(username, password, full_name):
    # Initialize Beanie
    await init_db()

    # Check if a superadmin already exists
    existing_super = await User.find_one(User.role == UserRole.SUPERADMIN)
    
    if existing_super:
        print(f"ERROR: A Superadmin already exists: {existing_super.username or existing_super.email}")
        print("Delete it manually from the database if you want to recreate it.")
        return

    # Check if a user with that username already exists
    existing_user = await User.find_one(User.username == username)
    if existing_user:
        print(f"WARNING: User with username {username} exists with role {existing_user.role}. Promoting to SUPERADMIN.")
        existing_user.role = UserRole.SUPERADMIN
        existing_user.password_hash = hash_password(password)
        await existing_user.save()
        print("Success: User promoted to SUPERADMIN.")
    else:
        # Create new Superadmin
        new_super = User(
            username=username,
            password_hash=hash_password(password),
            full_name=full_name,
            role=UserRole.SUPERADMIN
        )
        await new_super.insert()
        print(f"Success: Superadmin created: {username}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Manage Superadmin for ERP/Shop")
    parser.add_argument("--username", required=True, help="Superadmin username")
    parser.add_argument("--password", required=True, help="Superadmin password")
    parser.add_argument("--name", default="Super Admin", help="Full name")

    args = parser.parse_args()

    asyncio.run(create_superadmin(args.username, args.password, args.name))
