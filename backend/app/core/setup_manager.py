import logging
from app.models.config import SystemConfig
from app.models.company import Company
from app.models.inventory import Warehouse, ProductCategory
from app.models.pricing import PriceList

logger = logging.getLogger(__name__)

async def setup_initial_data():
    """
    World-Class Orchestrator for Structural Initialization (Sovereign Edition).
    Ensures ONLY basic organizational metadata exists. 
    """
    try:
        # 0. CONFIGURACIÓN MAESTRA DEL SISTEMA (The Brain)
        if await SystemConfig.count() == 0:
            logger.info("SETUP: [INIT] Inicializando Centro de Soberanía Técnica...")
            await SystemConfig(
                instance_name="DIROGSA ERP v4.0",
                reporting_currency="PEN",
                decimal_precision=2,
                timezone="America/Lima"
            ).insert()

        # 1. EMPRESA (Estructura Base)
        if await Company.count() == 0:
            logger.info("SETUP: [INIT] Creando estructura de empresa base...")
            await Company(
                name="EMPRESA POR CONFIGURAR",
                ruc="00000000000",
                address="---",
                functional_currency="PEN",
                tax_percentage=18.0
            ).insert()

        # 2. CATÁLOGO BASE
        if await ProductCategory.count() == 0:
            logger.info("SETUP: [INIT] Creando categoría VARIOS...")
            await ProductCategory(name="VARIOS", description="Categoría base").insert()
            
        # 3. ESTRUCTURA DE PRECIOS
        if await PriceList.count() == 0:
            logger.info("SETUP: [INIT] Creando Lista Maestra...")
            await PriceList(
                name="General",
                is_active=True,
                is_master=True,
                priority=0
            ).insert()

        logger.info("SETUP: [SUCCESS] Estructura base de Soberanía inicializada.")

    except Exception as e:
        logger.error(f"SETUP: [CRITICAL] Fallo en la inicialización estructural: {str(e)}")
