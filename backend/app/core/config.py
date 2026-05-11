import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

class Settings:
    PROJECT_NAME: str = "ERP System"
    
    # MongoDB
    MONGODB_URI: str = os.getenv("MONGODB_URI")
    MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "erp_db")
    
    # System Defaults (Governance)
    DEFAULT_INSTANCE_NAME: str = os.getenv("DEFAULT_INSTANCE_NAME", "Dirogsa Cloud ERP")
    DEFAULT_REPORTING_CURRENCY: str = os.getenv("DEFAULT_REPORTING_CURRENCY", "PEN")
    DEFAULT_TAX_PERCENTAGE: float = float(os.getenv("DEFAULT_TAX_PERCENTAGE", "18.0"))
    
    # CORS & Infrastructure
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "")
    RENDER_API_KEY: Optional[str] = os.getenv("RENDER_API_KEY")
    
    # JWT Security
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # Validation
    @classmethod
    def validate(cls):
        missing = []
        if not cls.MONGODB_URI:
            missing.append("MONGODB_URI")
        if not cls.JWT_SECRET_KEY:
            missing.append("JWT_SECRET_KEY")
        
        if missing:
            raise ValueError(f"Missing required environment variables: {', '.join(missing)}")

settings = Settings()
settings.validate()
