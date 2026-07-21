from typing import Dict, Any
from app.engines.dims_engine import DIMSEngine

class SubstitutionService:
    @classmethod
    async def get_substitutions(cls, sku: str) -> Dict[str, Any]:
        """
        Orquesta la búsqueda de sustituciones.
        Delega la lógica pesada al motor DIMS.
        """
        return await DIMSEngine.find_alternatives(sku)
