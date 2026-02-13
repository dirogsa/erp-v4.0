from app.services.auth_service import AuthService
from datetime import timedelta

def test_token():
    data = {"sub": "testuser", "role": "ADMIN"}
    token = AuthService.create_access_token(data)
    print(f"Generated Token: {token}")
    
    payload = AuthService.decode_token(token)
    print(f"Decoded Payload: {payload}")
    
    if payload and payload.get("sub") == "testuser":
        print("Token verification successful!")
    else:
        print("Token verification FAILED!")

if __name__ == "__main__":
    test_token()
