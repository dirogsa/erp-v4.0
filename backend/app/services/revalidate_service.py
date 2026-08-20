import httpx
import asyncio
import os
import logging

logger = logging.getLogger(__name__)

async def dispatch_revalidate(tag: str = "products"):
    """
    Fire-and-forget webhook to invalidate Next.js cache.
    This ensures that the ERP data changes reflect instantly on the frontend.
    """
    # URL of the Next.js frontend (default for local dev)
    NEXT_PUBLIC_URL = os.getenv("NEXT_PUBLIC_URL", "http://localhost:3000")
    REVALIDATE_SECRET = os.getenv("REVALIDATE_SECRET", "dirogsa-super-secret-revalidate-token")
    
    url = f"{NEXT_PUBLIC_URL}/api/revalidate"
    
    async def send_webhook():
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(
                    url,
                    json={"secret": REVALIDATE_SECRET, "tag": tag}
                )
                if response.status_code == 200:
                    logger.info(f"[Webhook] Successfully revalidated Next.js cache for tag: {tag}")
                else:
                    logger.warning(f"[Webhook] Failed to revalidate Next.js cache: {response.status_code} - {response.text}")
        except Exception as e:
            logger.error(f"[Webhook] Error calling Next.js revalidate endpoint: {e}")

    # Creates a background task in the running asyncio event loop
    asyncio.create_task(send_webhook())
