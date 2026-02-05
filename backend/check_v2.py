import urllib.request
import urllib.parse
import ssl
import sys

def check_wix():
    sku = "WA6214"
    # Intentamos la URL directa que suele redirigir
    url = f"https://wixeurope.com/es/catalogo-de-filtros?filtr={sku}"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
    }
    
    ctx = ssl._create_unverified_context()
    
    print(f"Probando conexion a: {url}")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, context=ctx, timeout=15) as res:
            print(f"Status: {res.status}")
            print(f"Final URL: {res.geturl()}")
            content = res.read().decode('utf-8', errors='ignore')
            print(f"Bytes recibidos: {len(content)}")
            if sku in content:
                print("SKU encontrado en el contenido!")
            else:
                print("SKU NO encontrado en el contenido.")
                # Ver un pedazo del contenido para ver si hay un error de bloqueo
                print("Preview:", content[:500])
    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == "__main__":
    check_wix()
