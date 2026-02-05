import urllib.parse
import urllib.request
import ssl
import json

# Lista de SKUs para probar
SKUS = ["WA6214", "WA6702", "WA6004"]

def test_wix_lookup(sku):
    url = "https://wixeurope.com/es/catalogo-de-filtros"
    
    # IMPORTANTE: WIX a veces espera los nombres de los campos exactos del formulario
    values = {
        "searchForm[filtronNumber]": sku,
        "searchForm[vehicleType]": "cars",
        "searchForm[filtronSubmit]": ""
    }
    
    data = urllib.parse.urlencode(values).encode('utf-8')
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://wixeurope.com/es/catalogo-de-filtros',
        'Origin': 'https://wixeurope.com'
    }
    
    context = ssl._create_unverified_context()
    
    print(f"\n--- Probando SKU: {sku} ---")
    try:
        req = urllib.request.Request(url, data=data, headers=headers)
        with urllib.request.urlopen(req, context=context, timeout=15) as response:
            res_url = response.geturl()
            content = response.read().decode('utf-8')
            
            print(f"URL de respuesta: {res_url}")
            print(f"Tamaño del contenido: {len(content)} bytes")
            
            # Verificar si el contenido tiene indicios de éxito
            if sku in content:
                print("✅ ÉXITO: El SKU se encontró en el cuerpo de la respuesta.")
                # Guardar un pedazo del HTML para ver la estructura
                with open(f"debug_{sku}.html", "w", encoding="utf-8") as f:
                    f.write(content)
            else:
                print("❌ FALLO: El SKU no aparece en el HTML devuelto.")
                
            # Verificar si hubo redirección (WIX suele redirigir a la ficha si hay match único)
            if "filtr-" in res_url or sku.lower() in res_url.lower():
                print("✅ ÉXITO: Hubo redirección a una página de producto.")
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")

for s in SKUS:
    test_wix_lookup(s)
