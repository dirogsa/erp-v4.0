from app.models.config import SystemConfig
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

async def bootstrap_system():
    """
    Realiza las tareas de inicialización crítica del sistema.
    Asegura que las reglas de gobierno existan antes de procesar peticiones.
    """
    try:
        # 1. Verificar Configuración Global
        config = await SystemConfig.find_one({})
        if not config:
            logger.info("BOOTSTRAP: [INFO] No se encontró configuración global. Inicializando con valores de entorno...")
            initial_config = SystemConfig(
                instance_name=settings.DEFAULT_INSTANCE_NAME,
                reporting_currency=settings.DEFAULT_REPORTING_CURRENCY,
                decimal_precision=2,
                timezone="America/Lima"
            )
            await initial_config.insert()
            logger.info(f"BOOTSTRAP: [SUCCESS] Sistema anclado exitosamente en {settings.DEFAULT_REPORTING_CURRENCY}.")
        else:
            logger.debug("BOOTSTRAP: [OK] Configuración global verificada.")
            
        # 2. Inyección de Esqueleto Vital (Master Data)
        from app.core.setup_manager import setup_initial_data
        await setup_initial_data()
        
        # 3. Sincronización estructural de marcas de productos con metadatos comerciales
        from app.routes.product_brands import perform_full_product_brand_sync
        logger.info("BOOTSTRAP: [INFO] Sincronizando catálogo maestro de marcas...")
        await perform_full_product_brand_sync()
        logger.info("BOOTSTRAP: [SUCCESS] Sincronización de marcas completada.")
        
    except Exception as e:
        logger.error(f"BOOTSTRAP: [CRITICAL] Fallo en la inicialización del sistema: {str(e)}")
        # No detenemos el arranque pero dejamos una alerta clara
