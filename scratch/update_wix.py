import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def update_wix_brand():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['erp_db']  # La DB local usada por tu ERP
    
    result = await db.product_brands.update_one(
        { "name": "WIX" },
        {
            "$set": {
                "origin": "USA",
                "description": "Con más de 80 años de liderazgo mundial en filtración automotriz, los filtros WIX ofrecen protección de equipo original (OEM). Su tecnología avanzada de celulosa y medios sintéticos atrapa hasta un 45% más de impurezas, asegurando el máximo rendimiento de su motor en las condiciones más extremas de las rutas peruanas.",
                "logo_public_id": "dirogsa/brands/wix-logo",
                "banner_public_id": "dirogsa/brands/wix-banner",
                "tagline": "PROTECCIÓN Y RENDIMIENTO NIVEL PREMIUM",
                "marketing_bullets": [
                    "Retención de suciedad superior al 99% en filtros de aceite y aire.",
                    "Tecnología Spin-On patentada para instalación rápida y segura.",
                    "Calidad OEM que no invalida la garantía de su vehículo.",
                    "Reemplazo extendido para flotillas de transporte pesado."
                ],
                "theme_color": "#ffc107"
            }
        }
    )
    
    if result.matched_count > 0:
        print(f"Éxito: Se actualizó la marca WIX (Modificados: {result.modified_count})")
    else:
        print("Advertencia: No se encontró la marca 'WIX' en la colección product_brands.")

asyncio.run(update_wix_brand())
