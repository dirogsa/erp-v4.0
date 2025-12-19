import asyncio
import os
from datetime import datetime
from app.database import init_db
from app.models.inventory import Product, DeliveryGuide, GuideStatus
from app.models.sales import SalesOrder, SalesInvoice, OrderItem, OrderStatus, Customer
from app.services import sales_service, delivery_service, inventory_service

# Mock Data
TEST_SKU = "TEST-SKU-REV"
TEST_RUC = "10123456789"

async def setup_data():
    print("--- SETUP ---")
    # 1. Ensure Product exists with stock
    product = await Product.find_one(Product.sku == TEST_SKU)
    if not product:
        product = Product(
            sku=TEST_SKU,
            name="Test Product Reversion",
            stock_current=100,
            cost=10.0,
            price=20.0,
            category="TEST"
        )
        await product.insert()
        print(f"Created Product: {TEST_SKU}")
    else:
        product.stock_current = 100
        await product.save()
        print(f"Reset Stock for: {TEST_SKU}")

    # 2. Ensure Customer exists
    customer = await Customer.find_one(Customer.ruc == TEST_RUC)
    if not customer:
        customer = Customer(
            name="Test Customer Reversion",
            ruc=TEST_RUC,
            address="Test Address"
        )
        await customer.insert()
        print(f"Created Customer: {TEST_RUC}")
    else:
        print(f"Customer exists: {TEST_RUC}")

async def run_test():
    await init_db()
    await setup_data()

    print("\n--- STEP 1: CREATE ORDER ---")
    order = SalesOrder(
        customer_name="Test Customer Reversion",
        customer_ruc=TEST_RUC,
        delivery_address="Test Address",
        items=[OrderItem(product_sku=TEST_SKU, quantity=10, unit_price=20.0)],
        date=datetime.now()
    )
    order = await sales_service.create_order(order)
    print(f"Order Created: {order.order_number} | Status: {order.status}")

    print("\n--- STEP 2: CREATE INVOICE ---")
    invoice = await sales_service.create_invoice(
        order_number=order.order_number,
        invoice_date=datetime.now().isoformat()
    )
    print(f"Invoice Created: {invoice.invoice_number}")
    
    # Reload Order to check status
    order = await sales_service.get_orders(search=order.order_number)
    order = order.items[0]
    print(f"Order Status after Invoice: {order.status} (Expected: INVOICED)")

    print("\n--- STEP 3: CREATE DELIVERY GUIDE ---")
    guide = await delivery_service.create_guide_from_invoice(
        invoice_number=invoice.invoice_number,
        notes="Test Guide"
    )
    print(f"Guide Created: {guide.guide_number} | Status: {guide.status}")

    print("\n--- STEP 4: DISPATCH GUIDE ---")
    guide = await delivery_service.dispatch_guide(guide.guide_number)
    print(f"Guide Dispatched: {guide.guide_number} | Status: {guide.status}")
    
    product = await Product.find_one(Product.sku == TEST_SKU)
    print(f"Stock after dispatch: {product.stock_current} (Expected: 90)")

    print("\n--- STEP 5: CANCEL GUIDE (TESTING DELETION) ---")
    try:
        # Currently this only sets status to CANCELLED
        guide = await delivery_service.cancel_guide(guide.guide_number)
        print(f"Guide Cancelled. Status: {guide.status} (User wants this DELETED)")
        
        # Check if actually deleted
        check_guide = await DeliveryGuide.find_one(DeliveryGuide.guide_number == guide.guide_number)
        if check_guide:
            print("❌ FAIL: Guide still exists in DB (should be deleted)")
        else:
            print("✅ PASS: Guide deleted from DB")

    except Exception as e:
        print(f"Error cancelling guide: {e}")

    print("\n--- STEP 6: DELETE INVOICE (TESTING ORDER REVERSION) ---")
    try:
        await sales_service.delete_invoice(invoice.invoice_number)
        print(f"Invoice {invoice.invoice_number} deleted")
        
        # Check Order Status
        order = await SalesOrder.find_one(SalesOrder.order_number == order.order_number)
        print(f"Order Status after Invoice Delete: {order.status} (Expected: PENDING)")
        
        if order.status == OrderStatus.PENDING:
             print("✅ PASS: Order reverted to PENDING")
        else:
             print("❌ FAIL: Order did NOT revert to PENDING")

    except Exception as e:
        print(f"Error deleting invoice: {e}")

    # Cleanup
    print("\n--- CLEANUP ---")
    await order.delete()
    print("Test Data Cleaned")

if __name__ == "__main__":
    asyncio.run(run_test())
