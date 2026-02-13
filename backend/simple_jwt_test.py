import os
from dotenv import load_dotenv
from jose import jwt
from datetime import datetime, timedelta

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

print(f"SECRET_KEY: {SECRET_KEY}")
print(f"ALGORITHM: {ALGORITHM}")

def test():
    data = {"sub": "test", "exp": datetime.utcnow() + timedelta(minutes=10)}
    token = jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)
    print(f"Token: {token}")
    
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"Decoded: {decoded}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test()
