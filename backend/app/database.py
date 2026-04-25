from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings

async def init_db():
    # Retrieve the MongoDB URI from settings
    mongo_uri = settings.MONGODB_URI
    
    if not mongo_uri:
        print("DB: [ERROR] MONGODB_URI not set. Database connection will fail.")
        return

    # Add timeouts to avoid hanging infinitely, but give it enough time for SSL handshake
    client = AsyncIOMotorClient(
        mongo_uri,
        serverSelectionTimeoutMS=30000,
        connectTimeoutMS=30000,
        socketTimeoutMS=30000
    )
    db_name = settings.MONGO_DB_NAME
    
    try:
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
                "app.models.inventory.Notification",
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
                "app.models.pricing.PriceList",
                "app.models.pricing.PriceEntry",
                "app.models.marketing.LoyaltyConfig",
                "app.models.finance.ExchangeRate"
            ],
            allow_index_dropping=True
        )
    except Exception as e:
        print(f"DB: [ERROR] init_db failed: {str(e)}")
        print("DB: [HINT] This error often occurs if your IP is not whitelisted in MongoDB Atlas or if firewall is blocking port 27017.")
        # Re-raise the exception so startup fails instead of hanging in an uninitialized state
        raise e
