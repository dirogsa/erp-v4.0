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
    Orquestador de Master Data Seeding.
    Solo inyecta datos si las colecciones críticas están vacías.
    """
    try:
        # 0. CONFIGURACIÓN MAESTRA DEL SISTEMA (El Cerebro)
        if await SystemConfig.count() == 0:
            logger.info("SETUP: [SEEDING] Creando Configuración Maestra Global...")
            default_config = SystemConfig(
                instance_name="ERP v4.0 - Enterprise Edition",
                reporting_currency="PEN",
                decimal_precision=2,
                timezone="America/Lima"
            )
            await default_config.insert()

        # 1. EMPRESA MAESTRA (El Sujeto Legal)
        if await Company.count() == 0:
            logger.info("SETUP: [SEEDING] Creando Empresa Maestra inicial...")
            main_company = Company(
                name="Mi Empresa Principal S.A.C.",
                ruc="20000000001",
                address="Av. Principal 123, Lima",
                functional_currency="PEN",
                tax_percentage=18.0,
                cost_method="PEPS"
            )
            await main_company.insert()
            
            # 2. ALMACÉN BASE (El Espacio Físico)
            if await Warehouse.count() == 0:
                logger.info("SETUP: [SEEDING] Creando Almacén Central...")
                default_warehouse = Warehouse(
                    name="Almacén Central",
                    location="Sede Principal",
                    company_id=str(main_company.id),
                    is_active=True
                )
                await default_warehouse.insert()

        # 3. ESTRUCTURA COMERCIAL (Las Reglas de Venta)
        if await PriceList.count() == 0:
            logger.info("SETUP: [SEEDING] Creando Lista de Precios Público General...")
            default_price_list = PriceList(
                name="Público General",
                currency="PEN",
                description="Lista de precios estándar para venta al público",
                is_active=True,
                is_default=True
            )
            await default_price_list.insert()

        # 4. CATÁLOGO BASE (La Organización)
        if await ProductCategory.count() == 0:
            logger.info("SETUP: [SEEDING] Creando Categoría 'Varios'...")
            await ProductCategory(name="Varios", description="Categoría por defecto").insert()
            
        if await ProductBrand.count() == 0:
            logger.info("SETUP: [SEEDING] Creando Marca 'Genérico'...")
            await ProductBrand(name="Genérico").insert()

        # 5. INTEGRIDAD DE POLÍTICAS DE VENTA (Soberanía por Empresa)
        companies = await Company.find_all().to_list()
        for company in companies:
            policy_exists = await SalesPolicy.find_one(SalesPolicy.company_id == str(company.id))
            if not policy_exists:
                logger.info(f"SETUP: [SEEDING] Creando Política de Ventas base para empresa: {company.name}")
                new_policy = SalesPolicy(
                    company_id=str(company.id),
                    cash_discount=0.0,
                    credit_30_days=3.0,
                    credit_60_days=5.0,
                    credit_90_days=8.0,
                    credit_180_days=15.0,
                    min_margin_guard_pct=12.0
                )
                await new_policy.insert()

        # 6. GARANTÍA FISCAL (Asegurar Impuestos por Empresa)
        for company in companies:
            if not company.tax_percentage:
                logger.info(f"SETUP: [FIX] Asignando IGV 18% por defecto a: {company.name}")
                company.tax_percentage = 18.0
                await company.save()

        logger.info("SETUP: [SUCCESS] Esqueleto Vital inyectado correctamente.")

    except Exception as e:
        logger.error(f"SETUP: [ERROR] Fallo en la inyección de datos iniciales: {str(e)}")
