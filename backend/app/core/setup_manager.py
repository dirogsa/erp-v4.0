import logging
from app.models.config import SystemConfig
from app.models.company import Company
from app.models.inventory import Warehouse, ProductCategory, ProductBrand
from app.models.pricing import PriceList
from app.models.sales import SalesPolicy
from app.core.config import settings

logger = logging.getLogger(__name__)

async def setup_initial_data():
    """
    World-Class Orchestrator for Structural Initialization.
    Ensures ONLY basic organizational metadata exists. 
    Strictly forbids seeding sensitive data (Users, Exchange Rates).
    """
    try:
        # 0. CONFIGURACIÓN MAESTRA DEL SISTEMA (Estructura Técnica)
        if await SystemConfig.count() == 0:
            logger.info("SETUP: [INIT] Inicializando estructura de configuración técnica...")
            await SystemConfig(
                instance_name="DIROGSA ERP v4.0",
                reporting_currency="PEN",
                decimal_precision=2,
                timezone="America/Lima"
            ).insert()

        # 1. EMPRESA (Estructura Base)
        # Nota: Se requiere al menos una empresa para que el sistema no falle en referencias,
        # pero los datos fiscales deben ser editados manualmente.
        if await Company.count() == 0:
            logger.info("SETUP: [INIT] Creando estructura de empresa base...")
            await Company(
                name="EMPRESA POR CONFIGURAR",
                ruc="00000000000",
                address="---",
                functional_currency="PEN",
                tax_percentage=18.0
            ).insert()

        # 2. CATÁLOGO BASE (Evita errores de referencia en importación)
        if await ProductCategory.count() == 0:
            logger.info("SETUP: [INIT] Creando categoría VARIOS...")
            await ProductCategory(name="VARIOS", description="Categoría base").insert()
            
        if await ProductBrand.count() == 0:
            logger.info("SETUP: [INIT] Creando marca GENERICO...")
            await ProductBrand(name="GENERICO").insert()

        # 3. ESTRUCTURA DE PRECIOS
        if await PriceList.count() == 0:
            logger.info("SETUP: [INIT] Creando Lista Maestra (Sin precios)...")
            await PriceList(
                name="General",
                is_active=True,
                is_master=True,
                priority=0
            ).insert()

        logger.info("SETUP: [SUCCESS] Estructura base inicializada. Requiere configuración manual de Usuarios y Finanzas.")

    except Exception as e:
        logger.error(f"SETUP: [CRITICAL] Fallo en la inicialización estructural: {str(e)}")
