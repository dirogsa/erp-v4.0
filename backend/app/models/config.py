from pydantic import BaseModel, Field
from beanie import Document
from typing import Optional, List

class LoyaltySettings(BaseModel):
    points_per_currency_unit: float = 1.0
    is_active: bool = True
    only_web_accumulation: bool = False
    local_to_web_rate: float = 1.0

class SalesPolicySettings(BaseModel):
    cash_discount_pct: float = 0.0
    credit_30_days_pct: float = 3.0
    credit_60_days_pct: float = 5.0
    credit_90_days_pct: float = 8.0
    credit_180_days_pct: float = 12.0
    min_margin_guard_pct: float = 12.0
    # Volume Discounts (Estrategia de Volumen)
    vol_3_discount_pct: float = 0.0
    vol_6_discount_pct: float = 0.0
    vol_12_discount_pct: float = 0.0

class SystemConfig(Document):
    instance_name: str = "DIROGSA ERP"
    reporting_currency: str = "PEN"
    decimal_precision: int = 2
    timezone: str = "America/Lima"
    allow_negative_stock: bool = False
    
    # Consolidación de Soberanía
    loyalty: LoyaltySettings = LoyaltySettings()
    sales_policy: SalesPolicySettings = SalesPolicySettings()

    class Settings:
        name = "system_config"
