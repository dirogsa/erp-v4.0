import urllib.request
import urllib.parse
import ssl
import sys

def test_wix(sku):
    search_url = "https://wixeurope.com/es/catalogo-de-filtros"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Referer': search_url,
    }
    context = ssl._create_unverified_context()
    
    # Try strategy 2 (GET with filtr)
    url = f"{search_url}?filtr={sku}"
    print(f"Trying GET {url}")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, context=context, timeout=10) as response:
            print(f"Status: {response.getcode()}")
            print(f"Final URL: {response.geturl()}")
            content = response.read().decode('utf-8', errors='ignore')
            print(f"Content length: {len(content)}")
            if "WL7476" in content:
                print("SKU found in content")
            else:
                print("SKU NOT found in content")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_wix("WL7476")
