from fastapi import APIRouter, HTTPException, Path, Query
from typing import Any, Dict, List
from app.engines.dims_engine import DIMSEngine
from app.services.dims_service import DIMSService

router = APIRouter(prefix="/api/v1/dims", tags=["DIMS Engine"])

@router.post("/import/batch", response_model=Dict[str, Any])
async def import_dims_batch(products_data: List[Dict[str, Any]]):
    """
    Importa un lote de archivos JSON de productos al sistema para el Laboratorio de Equivalencias.
    """
    try:
        result = await DIMSService.import_batch(products_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en importación batch: {str(e)}")

@router.get("/{sku}/alternatives", response_model=Dict[str, Any])
async def get_dimensional_alternatives(
    sku: str = Path(..., description="El SKU del producto para buscar alternativas"),
    flexibility: str = Query("high", description="Nivel de flexibilidad (high, medium, low)"),
):
    """
    Motor DIMS (Algoritmo 2): Encuentra alternativas dimensionales para un filtro dado.
    """
    try:
        results = await DIMSEngine.find_alternatives(sku, flexibility)
        return results
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en el motor DIMS: {str(e)}")

@router.get("/products", response_model=Dict[str, Any])
async def get_dims_products(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500),
    search: str = Query("", description="Término de búsqueda"),
    brand: str = Query("", description="Filtro por marca")
):
    """
    Retorna la lista de productos relacionales / referencias técnicas cargadas en el motor DIMS.
    """
    try:
        return await DIMSService.get_reference_products(page=page, limit=limit, search=search, brand=brand)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listando referencias DIMS: {str(e)}")

@router.get("/{sku}/equivalencies", response_model=Dict[str, Any])
async def get_direct_equivalencies(
    sku: str = Path(..., description="El SKU del producto para buscar equivalencias directas"),
):
    """
    Motor de Equivalencias (Algoritmo 3): Encuentra cruces directos basados en códigos OEM y Aftermarket.
    """
    try:
        return await DIMSService.get_direct_equivalencies(sku)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en algoritmo de equivalencias: {str(e)}")
