from datetime import datetime
from typing import Tuple, List, Optional
from ..models.sales import SalesInvoice, Customer, PaymentStatus

class RiskService:
    @staticmethod
    async def check_overdue_invoices(customer_ruc: str) -> List[SalesInvoice]:
        """
        Busca facturas vencidas y no pagadas para un cliente.
        """
        now = datetime.utcnow()
        overdue = await SalesInvoice.find(
            SalesInvoice.customer_ruc == customer_ruc,
            SalesInvoice.payment_status != PaymentStatus.PAID,
            SalesInvoice.due_date < now
        ).to_list()
        return overdue

    @staticmethod
    async def calculate_current_debt(customer_ruc: str) -> float:
        """
        Calcula la deuda total pendiente de un cliente.
        """
        invoices = await SalesInvoice.find(
            SalesInvoice.customer_ruc == customer_ruc,
            SalesInvoice.payment_status != PaymentStatus.PAID
        ).to_list()
        
        total_debt = sum(inv.total_amount - inv.amount_paid for inv in invoices)
        return round(total_debt, 3)

    @staticmethod
    async def validate_credit_request(customer_ruc: str, requested_amount: float) -> Tuple[bool, str]:
        """
        Valida si un cliente puede realizar un pedido a crédito.
        Retorna (autorizado, motivo)
        """
        customer = await Customer.find_one(Customer.ruc == customer_ruc)
        if not customer:
            return False, "Cliente no encontrado"

        # 1. Verificar si tiene el crédito habilitado
        if not customer.status_credit:
            return False, "El cliente no tiene habilitada la opción de pago a crédito."

        # 2. Verificar bloqueo manual (Hard Stop Senior)
        if customer.credit_manual_block:
            return False, "Crédito bloqueado manualmente por la administración. Por favor, regularice su situación."

        # 3. Verificar límite de crédito
        current_debt = await RiskService.calculate_current_debt(customer_ruc)
        total_exposure = current_debt + requested_amount
        
        if total_exposure > customer.credit_limit:
            return False, f"Límite de crédito excedido. Cupo disponible: S/ {max(0, customer.credit_limit - current_debt):.2f}. Pedido actual: S/ {requested_amount:.2f}"

        return True, "Crédito autorizado"
