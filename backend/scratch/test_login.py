
import requests

url = "http://localhost:8000/auth/login"
data = {"username": "superadmin", "password": "wrongpassword"}

try:
    print(f"Requesting POST {url}...")
    response = requests.post(url, json=data, timeout=5)
    print(f"Status: {response.status_code}")
    print(f"Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
