from datetime import datetime
from typing import Optional, List
from ..models.auth import ActivityLog, User

class AuditService:
    @staticmethod
    async def log_action(
        user: User,
        action: str,
        module: str,
        description: str,
        entity_id: Optional[str] = None,
        entity_name: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> ActivityLog:
        """
        Registra una acción en el log de auditoría.
        """
        log = ActivityLog(
            user_id=str(user.id),
            username=user.username or user.email,
            action=action,
            module=module,
            description=description,
            entity_id=entity_id,
            entity_name=entity_name,
            ip_address=ip_address
        )
        await log.insert()
        return log

    @staticmethod
    async def get_logs(
        skip: int = 0,
        limit: int = 50,
        module: Optional[str] = None,
        user_id: Optional[str] = None
    ):
        query = {}
        if module:
            query["module"] = module
        if user_id:
            query["user_id"] = user_id
            
        logs = await ActivityLog.find(query).sort("-timestamp").skip(skip).limit(limit).to_list()
        total = await ActivityLog.find(query).count()
        return logs, total

    @staticmethod
    async def delete_logs(log_ids: List[str]):
        """Borra logs específicos por ID"""
        from beanie import PydanticObjectId
        obj_ids = [PydanticObjectId(lid) for lid in log_ids]
        await ActivityLog.find({"_id": {"$in": obj_ids}}).delete()

    @staticmethod
    async def purge_logs(days: int, module: Optional[str] = None):
        """Borra logs más antiguos que X días, opcionalmente por módulo"""
        from datetime import timedelta
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        query = ActivityLog.timestamp < cutoff
        if module:
            query = (ActivityLog.timestamp < cutoff) & (ActivityLog.module == module)
            
        await ActivityLog.find(query).delete()
