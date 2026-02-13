from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings

async def init_db():
    # Retrieve the MongoDB URI from settings
    print("DB: [DEBUG] Starting init_db...")
    mongo_uri = settings.MONGODB_URI
    
    if not mongo_uri:
        print("DB: [ERROR] MONGODB_URI not set. Database connection will fail.")
        return

    print(f"DB: [DEBUG] Connecting to MongoDB URI: {mongo_uri[:25]}...")
    # Add timeouts to avoid hanging infinitely
    client = AsyncIOMotorClient(
        mongo_uri,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=5000,
        socketTimeoutMS=5000
    )
    db_name = settings.MONGO_DB_NAME
    print(f"DB: [DEBUG] Using database: {db_name}")
    
    try:
        print("DB: [DEBUG] Initializing Beanie models...")
        # Initialize Beanie with the database and document models
        await init_beanie(
            database=client[db_name], 
            document_models=[
                "app.models.inventory.Product",
                "app.models.inventory.VehicleBrand",
                "app.models.inventory.SearchLog",
                "app.models.inventory.ProductCategory",
                "app.models.inventory.PriceHistory",
                "app.models.inventory.StockMovement",
                "app.models.inventory.Warehouse",
                "app.models.inventory.DeliveryGuide",
                "app.models.purchasing.PurchaseOrder",
                "app.models.purchasing.PurchaseInvoice",
                "app.models.purchasing.Supplier",
                "app.models.purchasing.PurchaseQuote",
                "app.models.sales.SalesOrder",
                "app.models.sales.SalesInvoice",
                "app.models.sales.Customer",
                "app.models.sales.SalesQuote",
                "app.models.sales.SalesNote",
                "app.models.sales.SalesPolicy",
                "app.models.company.Company",
                "app.models.auth.User",
                "app.models.auth.B2BApplication",
                "app.models.auth.ActivityLog",
                "app.models.staff.Staff",
                "app.models.pricing.PricingRule",
                "app.models.marketing.LoyaltyConfig"
            ],
            allow_index_dropping=True
        )
        print("DB: [DEBUG] init_db completed successfully.")
    except Exception as e:
        print(f"DB: [ERROR] init_db failed: {str(e)}")
        import traceback
        traceback.print_exc()
