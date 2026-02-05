import requests
from bs4 import BeautifulSoup

def test_wix_requests(sku):
    base_url = "https://wixeurope.com"
    search_url = f"{base_url}/es/catalogo-de-filtros"
    
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Referer': search_url,
    })

    print(f"Searching for {sku}...")
    try:
        response = session.get(search_url, params={'filtr': sku}, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"URL: {response.url}")
        
        if response.status_code == 200:
            if "WL7476" in response.text:
                print("SUCCESS: SKU found in response text!")
                # Optional: Check for specific data points
                soup = BeautifulSoup(response.text, 'html.parser')
                title = soup.find('h1')
                if title:
                    print(f"Page Title/Header: {title.text.strip()}")
            else:
                print("WARNING: SKU text not explicitly found in response (might be rendered via JS or blocking content?)")
                print(f"Preview: {response.text[:200]}...")
        else:
            print("FAILED: Non-200 status code")

    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_wix_requests("WL7476")
