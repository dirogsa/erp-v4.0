import urllib.parse
import urllib.request
import ssl

def search_wix(code: str):
    base_url = "https://wixeurope.com/es/catalogo-de-filtros"
    
    # Payload para el formulario de Wix
    values = {
        "searchForm[filtronNumber]": code,
        "searchForm[vehicleType]": "cars",
        "searchForm[filtronSubmit]": ""
    }
    
    data = urllib.parse.urlencode(values).encode('utf-8')
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    req = urllib.request.Request(base_url, data=data, headers=headers)
    
    # Ignorar certificados SSL para pruebas si es necesario (Wix suele estar bien pero por si acaso)
    context = ssl._create_unverified_context()
    
    try:
        print(f"Buscando {code} en Wix Europe...")
        with urllib.request.urlopen(req, context=context) as response:
            final_url = response.geturl()
            content = response.read().decode('utf-8')
            
            print(f"URL Final: {final_url}")
            
            if code in content:
                print("¡Éxito! El código se encontró en el HTML.")
                with open("temp_wix.html", "w", encoding="utf-8") as f:
                    f.write(content)
            else:
                print("No se encontró el código en la respuesta directa.")
                # A veces redirige a una lista si hay múltiples, o a nada.
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    search_wix("WA6214")
