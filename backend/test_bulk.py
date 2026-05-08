import requests
import json

base_url = "http://localhost:8000"

def test_bulk_dispatch():
    # First, let's find some DRAFT guides
    response = requests.get(f"{base_url}/delivery/guides?status=DRAFT&limit=5")
    guides = response.json().get("items", [])
    
    if not guides:
        print("No draft guides found to test.")
        return
        
    guide_numbers = [g["guide_number"] for g in guides]
    print(f"Testing bulk dispatch for: {guide_numbers}")
    
    # We need a token if it's protected, but let's see if we can do it without or if we can get one
    # Assuming for now we can skip auth for local test if not strictly enforced on this route
    # (Actually it is Depends(get_current_company_id))
    
    # Let's try to just call it and see the response
    payload = {"guide_numbers": guide_numbers}
    res = requests.post(f"{base_url}/delivery/guides/bulk-dispatch", json=payload)
    
    print(f"Status Code: {res.status_code}")
    print(f"Response: {res.text}")

if __name__ == "__main__":
    test_bulk_dispatch()
