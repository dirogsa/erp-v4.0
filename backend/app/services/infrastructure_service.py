import httpx
import logging
from typing import List, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

class InfrastructureService:
    def __init__(self):
        self.api_key = settings.RENDER_API_KEY
        self.base_url = "https://api.render.com/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json"
        }

    async def get_services_status(self) -> List[Dict[str, Any]]:
        """
        Obtiene el estado de todos los servicios asociados a la cuenta de Render.
        """
        if not self.api_key:
            # Fallback para desarrollo o si no hay API Key configurada
            return [
                {"name": "erp-api", "status": "operational", "type": "backend", "deployed_at": "Localhost"},
                {"name": "erp-admin", "status": "operational", "type": "frontend", "deployed_at": "Localhost"},
                {"name": "erp-shop", "status": "operational", "type": "frontend", "deployed_at": "Localhost"},
                {"name": "erp-mobile", "status": "operational", "type": "mobile", "deployed_at": "Localhost"}
            ]

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/services",
                    headers=self.headers,
                    params={"limit": 20}
                )
                
                if response.status_code != 200:
                    logger.error(f"Render API Error: {response.status_code} - {response.text}")
                    return []

                services_data = response.json()
                results = []
                
                # Mapeamos los servicios que nos interesan (los definidos en render.yaml)
                target_services = ["erp-api", "erp-admin", "erp-shop", "erp-mobile"]
                
                for item in services_data:
                    svc = item.get("service", {})
                    name = svc.get("name")
                    
                    if name in target_services:
                        # Obtener el último despliegue para saber si falló
                        deploy_info = await self._get_latest_deploy_info(client, svc.get("id"))
                        
                        results.append({
                            "id": svc.get("id"),
                            "name": name,
                            "type": svc.get("type"),
                            "status": deploy_info.get("status", "unknown"),
                            "updated_at": svc.get("updatedAt"),
                            "url": svc.get("serviceDetails", {}).get("url", ""),
                            "last_error": deploy_info.get("error"),
                            "commit_msg": deploy_info.get("commit_msg"),
                            "commit_id": deploy_info.get("commit_id")
                        })
                
                return results

        except Exception as e:
            logger.error(f"Error connecting to Infrastructure API: {str(e)}")
            return []

    async def _get_latest_deploy_info(self, client: httpx.AsyncClient, service_id: str) -> Dict[str, Any]:
        """Consulta detalles profundos del último build/deploy"""
        try:
            response = await client.get(
                f"{self.base_url}/services/{service_id}/deploys",
                headers=self.headers,
                params={"limit": 1}
            )
            if response.status_code == 200:
                deploys = response.json()
                if deploys:
                    d = deploys[0].get("deploy", {})
                    commit = d.get("commit", {})
                    return {
                        "status": d.get("status"), 
                        "error": d.get("errorMessage") or d.get("lastError"),
                        "commit_msg": commit.get("message"),
                        "commit_id": commit.get("id")[:7] if commit.get("id") else None
                    }
            return {"status": "unknown"}
        except:
            return {"status": "unknown"}

infrastructure_service = InfrastructureService()
