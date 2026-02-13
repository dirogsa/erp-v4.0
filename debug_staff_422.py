import requests
import json

base_url = "http://localhost:8000/staff"

def test_get():
    print("Testing GET /staff...")
    try:
        response = requests.get(base_url)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 422:
            print("Validation Error Details:")
            print(json.dumps(response.json(), indent=2))
        else:
            print("Success or other error:")
            print(response.text[:200])
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_get()
