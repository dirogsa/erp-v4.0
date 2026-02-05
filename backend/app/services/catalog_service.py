import requests
from bs4 import BeautifulSoup
from app.exceptions.business_exceptions import ValidationException
import logging

# Configure logger
logger = logging.getLogger(__name__)

async def lookup_wix_filter(sku_clean: str) -> str:
    """
    Busca en el catálogo de WIX Europe usando requests y simulando un navegador real.
    Sigue redirecciones y maneja listas de resultados.
    """
    base_url = "https://wixeurope.com"
    search_url = f"{base_url}/es/catalogo-de-filtros"
    
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Referer': search_url,
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1',
    })

    try:
        # Estrategia: GET directo con parámetro filtr
        # Esto suele disparar una búsqueda interna que redirige si es único, o muestra lista
        params = {'filtr': sku_clean}
        
        logger.info(f"Buscando SKU {sku_clean} en WIX Europe...")
        response = session.get(search_url, params=params, timeout=30, allow_redirects=True)
        
        if response.status_code != 200:
            logger.error(f"Error {response.status_code} al buscar {sku_clean}")
            return ""

        final_url = response.url
        content = response.text
        
        # Caso 1: Redirección exitosa a página de producto
        # Las URLs de producto suelen tener el formato /categoria,SKU
        # Ejemplo: /filtros-de-aceite,WL7476
        if f",{sku_clean}" in final_url or "product-table-sizes" in content:
            logger.info(f"ÉXITO: Encontrado {sku_clean} directamente en {final_url}")
            return content

        # Caso 2: Estamos en una lista de resultados (Search Results)
        # Hay que buscar un enlace que contenga el SKU
        soup = BeautifulSoup(content, 'html.parser')
        
        # Buscamos enlaces en la tabla de resultados
        # Selectores típicos de Wix/Filtron para resultados
        # Suelen ser enlaces dentro de una tabla con clase 'marka' o similar, o simplemente hrefs que contengan el SKU
        
        links = soup.find_all('a', href=True)
        target_link = None
        
        for link in links:
            href = link['href']
            # Verificamos si el enlace apunta a una página de producto (contiene coma y el SKU)
            if f",{sku_clean}" in href:
                target_link = href
                break
            
            # O si contiene el SKU y parece una URL de catálogo
            if sku_clean in href and "/catalogo-de-filtros/" in href:
                target_link = href
                break
                
        if target_link:
            if not target_link.startswith("http"):
                target_link = base_url + target_link if target_link.startswith("/") else f"{base_url}/{target_link}"
            
            logger.info(f"Enlace de producto encontrado en resultados: {target_link}")
            product_response = session.get(target_link, timeout=30)
            
            if product_response.status_code == 200:
                return product_response.text

        logger.warning(f"No se pudo resolver la página de producto para {sku_clean}. URL final: {final_url}")
        return ""

    except Exception as e:
        logger.error(f"Excepción fatal buscando {sku_clean}: {str(e)}")
        return ""

async def lookup_azumi_filter(sku_clean: str) -> str:
    """
    Busca en el catálogo de AZUMI (Japón/Global).
    """
    base_url = "https://azfilter.jp"
    search_url = f"{base_url}/catalogue/catalogue/search-part-number"
    
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })

    try:
        logger.info(f"Buscando SKU {sku_clean} en AZUMI...")
        params = {'product_id': sku_clean}
        response = session.get(search_url, params=params, timeout=30)
        
        if response.status_code == 200:
            # Azumi suele devolver la página con resultados directamente
            return response.text
            
        logger.error(f"Error {response.status_code} en Azumi para {sku_clean}")
        return ""
    except Exception as e:
        logger.error(f"Excepción fatal buscando en Azumi {sku_clean}: {str(e)}")
        return ""

async def lookup_filtron_filter(sku_clean: str) -> str:
    """
    Busca en el catálogo de FILTRON.
    Filtron a menudo comparte backend con Wix, pero tiene su propia URL base.
    """
    base_url = "https://filtron.eu"
    # Filtron search structure: /es/busqueda-de-catalogo?number=...
    search_url = f"{base_url}/es/busqueda-de-catalogo"
    
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    })

    try:
        logger.info(f"Buscando SKU {sku_clean} en FILTRON...")
        params = {'number': sku_clean} 
        # Filtron often uses 'number' or similar query param, 
        # sometimes it redirects like Wix. Validar si funciona como Wix.
        # Si es mirror de Wix, la estructura suele ser muy similar.
        
        response = session.get(search_url, params=params, timeout=30)
        if response.status_code == 200:
             return response.text
             
        logger.error(f"Error {response.status_code} en Filtron para {sku_clean}")
        return ""
    except Exception as e:
        logger.error(f"Excepción fatal buscando en Filtron {sku_clean}: {str(e)}")
        return ""

def _detect_brand_by_sku(sku: str) -> str:
    """
    Intenta deducir la marca basada en el formato del SKU.
    """
    import re
    sku = sku.upper()
    
    # Patrones WIX (WA, WL, WF, WP seguida de dígitos)
    if re.match(r"^W[ALFP]\d+", sku):
        return "WIX"
    
    # Patrones FILTRON (AP, AR, OE, OP, PP, K, AK seguida de dígitos generalmente)
    # Ejemplo: OE 648, OP 526, AP 134, AK 370
    if re.match(r"^(AP|AR|OE|OP|PP|AK|K|PM)\s*\d+", sku):
        return "FILTRON"
        
    # Patrones AZUMI (Basados en el ejemplo AC..., y comunes japoneses)
    # AC = Air Cabin, y otros prefijos comunes de Azumi como C, O, A pueden overlap
    # Por ahora priorizamos AC para Azumi explícitamente y fallback si no es Wix
    if sku.startswith("AC"):
        return "AZUMI"
        
    # Si no coincide con WIX explícito, y estamos en contexto mixto,
    # podríamos retornar UNKNOWN o default.
    return "UNKNOWN"

async def perform_catalog_lookup(sku: str) -> str:
    """
    Orquestador inteligente. 
    Detecta la marca por el SKU y consulta el catálogo específico.
    """
    sku_clean = sku.strip().upper()
    detected_brand = _detect_brand_by_sku(sku_clean)
    
    logger.info(f"SKU: {sku_clean} - Marca detectada: {detected_brand}")
    
    if detected_brand == "WIX":
        return await lookup_wix_filter(sku_clean)
    elif detected_brand == "FILTRON":
        return await lookup_filtron_filter(sku_clean)
    elif detected_brand == "AZUMI":
        return await lookup_azumi_filter(sku_clean)
    else:
        # Fallback inteligente: Si no reconocemos el patrón WIX, probamos Azumi
        # ya que WIX tiene patrones muy estrictos (W...)
        logger.info(f"Marca no identificada para {sku_clean}, probando Azumi como fallback...")
        azumi_result = await lookup_azumi_filter(sku_clean)
        if azumi_result:
            return azumi_result
            
        # Último recurso: WIX
        return await lookup_wix_filter(sku_clean)
