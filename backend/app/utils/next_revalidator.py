import httpx
import logging
import asyncio
from app.core.config import settings

logger = logging.getLogger(__name__)

async def trigger_nextjs_revalidation(tag: str):
    """
    Sends a request to the Next.js frontend to revalidate a specific cache tag.
    Includes robust retry logic for network or temporary Vercel failures.
    """
    url = f"{settings.NEXTJS_FRONTEND_URL}/api/revalidate"
    params = {
        "secret": settings.REVALIDATE_SECRET,
        "tag": tag
    }
    
    delays = [1, 3] # Retrasos para los reintentos
    
    async with httpx.AsyncClient(timeout=5.0) as client:
        for attempt, delay in enumerate([0] + delays, 1):
            if attempt > 1:
                await asyncio.sleep(delay)
                logger.info(f"Reintentando revalidación para tag '{tag}' (Intento {attempt}/3)...")
                
            try:
                response = await client.get(url, params=params)
                
                # Si falla por autenticación, abortar inmediatamente (no se arregla reintentando)
                if response.status_code in (401, 403):
                    logger.error(f"Error de Autorización (HTTP {response.status_code}) al revalidar tag '{tag}'. Revisa REVALIDATE_SECRET.")
                    return False
                    
                response.raise_for_status()
                logger.info(f"Éxito: Caché de Next.js revalidada para tag '{tag}' en el intento {attempt}.")
                return True
                
            except httpx.HTTPStatusError as e:
                logger.warning(f"Error HTTP {e.response.status_code} revalidando tag '{tag}' (Intento {attempt}/3).")
            except httpx.RequestError as e:
                logger.warning(f"Error de red/RequestTimeout revalidando tag '{tag}' (Intento {attempt}/3): {str(e)}")
            except Exception as e:
                logger.warning(f"Error inesperado revalidando tag '{tag}' (Intento {attempt}/3): {str(e)}")
        
    logger.error(f"Fallo Definitivo: No se pudo revalidar el tag '{tag}' de Next.js después de 3 intentos.")
    return False

def trigger_nextjs_revalidation_sync(tag: str):
    """
    Sync wrapper to safely run the revalidation in a fire-and-forget background task
    if you are calling this from a sync function or just want to detach it.
    """
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(trigger_nextjs_revalidation(tag))
    except RuntimeError:
        asyncio.run(trigger_nextjs_revalidation(tag))
