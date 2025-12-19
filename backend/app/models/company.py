from typing import Optional
from beanie import Document, Indexed
from pydantic import BaseModel
from datetime import datetime

class Company(Document):
    name: str
    ruc: Indexed(str, unique=True)
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    
    # Bank Info
    bank_name: Optional[str] = None
    account_soles: Optional[str] = None
    account_dollars: Optional[str] = None
    
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()

    class Settings:
        name = "companies"
