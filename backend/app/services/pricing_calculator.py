from typing import Optional
from ..models.config import SystemConfig

class PricingCalculator:
    @staticmethod
    async def get_policy():
        """Retorna la configuración de políticas comerciales desde SystemConfig"""
        config = await SystemConfig.find_one({})
        if not config:
            config = SystemConfig()
            await config.insert()
        return config.sales_policy

    @staticmethod
    def calculate_price(base_price: float, terms: int, policy) -> float:
        """
        Calcula el precio final basado en los términos de crédito y la política soberana.
        terms: 0, 30, 60, 90, 180
        """
        if terms <= 0:
            # Aplicar descuento por contado si existe (ej: cash_discount_pct = -2.0)
            return round(base_price * (1 + policy.cash_discount_pct / 100), 3)
        
        # Seleccionar recargo
        surcharge = 0.0
        if terms == 30:
            surcharge = policy.credit_30_days_pct
        elif terms == 60:
            surcharge = policy.credit_60_days_pct
        elif terms == 90:
            surcharge = policy.credit_90_days_pct
        elif terms == 180:
            surcharge = policy.credit_180_days_pct
        else:
            # Fallback proporcional robusto
            if terms > 90:
                surcharge = policy.credit_180_days_pct
            elif terms > 60:
                surcharge = policy.credit_90_days_pct
            elif terms > 30:
                surcharge = policy.credit_60_days_pct
            else:
                surcharge = policy.credit_30_days_pct

        return round(base_price * (1 + surcharge / 100), 3)

    @classmethod
    async def get_adjusted_price(cls, base_price: float, terms: int) -> float:
        policy = await cls.get_policy()
        return cls.calculate_price(base_price, terms, policy)
