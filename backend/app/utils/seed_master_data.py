import asyncio
from app.database import init_db
from app.models.inventory import ProductCategory, AttributeDefinition, AttributeType

async def seed_professional_categories(company_id: str):
    """
    Seeds world-class professional categories for the automotive industry.
    """
    categories = [
        {
            "name": "FILTRO DE ACEITE",
            "import_aliases": ["OIL FILTER", "LUBE FILTER"],
            "features_schema": ["Válvula de Alivio", "Válvula Anti-retorno", "Cuerpo Metálico"],
            "attributes_schema": [
                AttributeDefinition(key="thread", label="Rosca", type=AttributeType.TEXT, required=True),
                AttributeDefinition(key="outer_diameter", label="Diámetro Exterior (mm)", type=AttributeType.NUMBER),
                AttributeDefinition(key="height", label="Altura (mm)", type=AttributeType.NUMBER),
                AttributeDefinition(key="gasket_id", label="Diámetro Junta Int. (mm)", type=AttributeType.NUMBER)
            ]
        },
        {
            "name": "FILTRO DE AIRE",
            "import_aliases": ["AIR FILTER", "PANEL FILTER"],
            "features_schema": ["Con Prefiltro", "Marco de Goma", "Refuerzo Metálico"],
            "attributes_schema": [
                AttributeDefinition(key="length", label="Largo (mm)", type=AttributeType.NUMBER),
                AttributeDefinition(key="width", label="Ancho (mm)", type=AttributeType.NUMBER),
                AttributeDefinition(key="height", label="Altura (mm)", type=AttributeType.NUMBER),
                AttributeDefinition(key="shape", label="Forma", type=AttributeType.SELECT, options=["Panel", "Cilíndrico", "Ovalado"])
            ]
        },
        {
            "name": "FILTRO DE COMBUSTIBLE",
            "import_aliases": ["FUEL FILTER", "GASOLINE FILTER", "DIESEL FILTER"],
            "features_schema": ["Separador de Agua", "Sensor de Agua", "Cebador"],
            "attributes_schema": [
                AttributeDefinition(key="inlet", label="Entrada", type=AttributeType.TEXT),
                AttributeDefinition(key="outlet", label="Salida", type=AttributeType.TEXT),
                AttributeDefinition(key="micron_rating", label="Micraje", type=AttributeType.NUMBER)
            ]
        },
        {
            "name": "BUJÍA DE ENCENDIDO",
            "import_aliases": ["SPARK PLUG"],
            "features_schema": ["Iridium", "Platinum", "Multi-electrodo"],
            "attributes_schema": [
                AttributeDefinition(key="heat_range", label="Grado Térmico", type=AttributeType.NUMBER),
                AttributeDefinition(key="gap", label="Luz (Gap) mm", type=AttributeType.NUMBER),
                AttributeDefinition(key="hex_size", label="Medida Hexagonal", type=AttributeType.TEXT),
                AttributeDefinition(key="thread_diameter", label="Diámetro Rosca", type=AttributeType.TEXT)
            ]
        },
        {
            "name": "BATERÍA",
            "import_aliases": ["BATTERY"],
            "features_schema": ["Libre Mantenimiento", "Ojo Mágico", "Ciclo Profundo"],
            "attributes_schema": [
                AttributeDefinition(key="amperage", label="Amperaje (Ah)", type=AttributeType.NUMBER, required=True),
                AttributeDefinition(key="voltage", label="Voltaje (V)", type=AttributeType.NUMBER, options=["12", "24", "6"]),
                AttributeDefinition(key="cca", label="CCA (-18°C)", type=AttributeType.NUMBER),
                AttributeDefinition(key="terminal_pos", label="Posición Borne", type=AttributeType.SELECT, options=["Derecha", "Izquierda"])
            ]
        }
    ]

    for cat_data in categories:
        existing = await ProductCategory.find_one(
            ProductCategory.name == cat_data["name"],
            ProductCategory.company_id == company_id
        )
        if not existing:
            cat = ProductCategory(**cat_data, company_id=company_id)
            await cat.insert()
            print(f"Created category: {cat_data['name']} for company {company_id}")
        else:
            print(f"Category {cat_data['name']} already exists for company {company_id}")

if __name__ == "__main__":
    # This script should be run via a management command or manually
    pass
