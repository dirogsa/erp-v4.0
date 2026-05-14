from datetime import datetime
from typing import Optional, List
from ..models.auth import ActivityLog, User

class AuditService:
    # World-Class Governance: Filter noise to preserve space and focus.
    VITAL_MODULES = ["INVENTORY", "SALES", "PURCHASING", "FINANCE", "PRICING", "LOGISTICS"]
    VITAL_ACTIONS = ["CREATE", "UPDATE", "DELETE", "STOCK_ADJUST", "VOID", "MAP_ORPHAN"]
    
    # Toggle this to False if you want ZERO non-vital logs
    ECONOMY_MODE = True 

    @staticmethod
    async def log_action(
        user: User,
        action: str,
        module: str,
        description: str,
        entity_id: Optional[str] = None,
        entity_name: Optional[str] = None,
        ip_address: Optional[str] = None,
        company_id: Optional[str] = None
    ) -> Optional[ActivityLog]:
        """
        Smart Logger: Decides what is vital and what is noise.
        Defensive: NEVER blocks the main execution flow if logging fails.
        """
        try:
            from datetime import timedelta
            
            # 1. Classification
            is_vital = (module in AuditService.VITAL_MODULES) or (action in AuditService.VITAL_ACTIONS)
            
            # 2. Economy Policy
            if AuditService.ECONOMY_MODE and not is_vital:
                return None
                
            # 3. Retention Policy
            expire_at = None
            if not is_vital:
                # Non-vital logs expire in 30 days to save space
                expire_at = datetime.utcnow() + timedelta(days=30)
                
            # Prioritize provided company_id, then user's current company
            target_company_id = company_id or (user.current_company_id if user and hasattr(user, 'current_company_id') else None)

            log = ActivityLog(
                user_id=str(user.id) if user and hasattr(user, 'id') else "SYSTEM",
                username=user.username if user and hasattr(user, 'username') else (user.email if user and hasattr(user, 'email') else "system"),
                action=action,
                module=module,
                description=description,
                entity_id=entity_id,
                entity_name=entity_name,
                ip_address=ip_address,
                is_critical=is_vital,
                expire_at=expire_at,
                company_id=target_company_id
            )
            await log.insert()
            return log
        except Exception as e:
            # World-Class Resilience: A log failure must NOT stop the business.
            print(f"⚠️ [AUDIT_ERROR] Failed to record log: {str(e)}")
            return None

    @staticmethod
    async def get_logs(
        skip: int = 0,
        limit: int = 50,
        module: Optional[str] = None,
        user_id: Optional[str] = None,
        company_id: Optional[str] = None
    ):
        query = {}
        if module:
            query["module"] = module
        if user_id:
            query["user_id"] = user_id
        if company_id:
            query["company_id"] = company_id
            
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
