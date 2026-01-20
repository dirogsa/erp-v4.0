from typing import Optional
from ..models.sales import SalesPolicy

class PricingCalculator:
    @staticmethod
    async def get_policy() -> SalesPolicy:
        policy = await SalesPolicy.find_one()
        if not policy:
            policy = SalesPolicy()
            await policy.insert()
        return policy

    @staticmethod
    def calculate_price(base_price: float, terms: int, policy: SalesPolicy) -> float:
        """
        Calcula el precio final basado en los términos de crédito y la política.
        terms: 0, 30, 60, 90, 180
        """
        if terms <= 0:
            # Aplicar descuento por contado si existe (ej: cash_discount = -2.0)
            return round(base_price * (1 + policy.cash_discount / 100), 3)
        
        # Seleccionar recargo
        surcharge = 0.0
        if terms == 30:
            surcharge = policy.credit_30_days
        elif terms == 60:
            surcharge = policy.credit_60_days
        elif terms == 90:
            surcharge = policy.credit_90_days
        elif terms == 180:
            surcharge = policy.credit_180_days
        else:
            # Si es un plazo no estándar, buscar el recargo más cercano o proporcional?
            # Por ahora, si no es estándar, no recargamos o usamos el máximo inferior.
            # Decisión Senior: Solo permitir plazos estándar o devolver error.
            # Para robustez, usaremos 180 si es > 90, etc.
            if terms > 90:
                surcharge = policy.credit_180_days
            elif terms > 60:
                surcharge = policy.credit_90_days
            elif terms > 30:
                surcharge = policy.credit_60_days
            else:
                surcharge = policy.credit_30_days

        return round(base_price * (1 + surcharge / 100), 3)

    @classmethod
    async def get_adjusted_price(cls, base_price: float, terms: int) -> float:
        policy = await cls.get_policy()
        return cls.calculate_price(base_price, terms, policy)
