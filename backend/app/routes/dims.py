from fastapi import APIRouter, HTTPException, Path, Query
from typing import Any, Dict
from app.engines.dims_engine import DIMSEngine

router = APIRouter(prefix="/api/v1/dims", tags=["DIMS Engine"])

@router.get("/{sku}/alternatives", response_model=Dict[str, Any])
async def get_dimensional_alternatives(
    sku: str = Path(..., description="El SKU del producto para buscar alternativas"),
    flexibility: str = Query("high", description="Nivel de flexibilidad (high, medium, low)"),
):
    """
    Motor DIMS: Encuentra alternativas dimensionales para un filtro dado.
    """
    try:
        results = await DIMSEngine.find_alternatives(sku, flexibility)
        return results
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en el motor DIMS: {str(e)}")
