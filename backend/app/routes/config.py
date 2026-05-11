from fastapi import APIRouter, Depends, HTTPException
from app.models.config import SystemConfig
from app.models.auth import User
from app.routes.auth import get_current_user
from typing import Dict, Any

router = APIRouter(prefix="/config", tags=["Configuration"])

@router.get("/", response_model=SystemConfig)
async def get_config(current_user: User = Depends(get_current_user)):
    """Obtiene la configuración maestra del sistema"""
    config = await SystemConfig.find_one({})
    if not config:
        # Fallback de seguridad por si falla la auto-inicialización
        config = SystemConfig()
        await config.insert()
    return config

@router.put("/", response_model=SystemConfig)
async def update_config(
    new_data: Dict[str, Any], 
    current_user: User = Depends(get_current_user)
):
    """Actualiza la configuración maestra (Solo Admin)"""
    if current_user.role not in ["ADMIN", "SUPERADMIN"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para modificar la configuración global")
        
    config = await SystemConfig.find_one({})
    if not config:
        config = SystemConfig()
        await config.insert()
        
    # Actualización dinámica de campos
    for key, value in new_data.items():
        if hasattr(config, key):
            setattr(config, key, value)
            
    await config.save()
    return config

@router.get("/infrastructure/status")
async def get_infra_status(current_user: User = Depends(get_current_user)):
    """Consulta el estado de salud de los servicios en la infraestructura de Render"""
    if current_user.role not in ["ADMIN", "SUPERADMIN"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para ver la infraestructura")
    
    from app.services.infrastructure_service import infrastructure_service
    return await infrastructure_service.get_services_status()
