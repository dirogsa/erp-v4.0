import asyncio
import os
from app.database import init_db
from app.models.sales import SalesOrder

async def check_last_order():
    await init_db()
    
    # Get last created order
    order = await SalesOrder.find_all().sort("-date").limit(1).to_list()
    
    if order:
        o = order[0]
        print(f"Order: {o.order_number}")
        print(f"Customer: {o.customer_name}")
        print(f"Total: {o.total_amount}")
        print(f"Payment Terms: {o.payment_terms}")
    else:
        print("No orders found.")

if __name__ == "__main__":
    asyncio.run(check_last_order())
