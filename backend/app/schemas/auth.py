from pydantic import BaseModel, EmailStr
from typing import Optional
from ..models.auth import UserRole, B2BStatus, UserTier

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[UserRole] = None
    classification: Optional[UserTier] = None

class UserLogin(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: str

class UserCreate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: str
    full_name: str

class UserResponse(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: str
    role: UserRole
    classification: UserTier
    ruc_linked: Optional[str] = None

class B2BApplicationCreate(BaseModel):
    ruc: str
    company_name: str
    contact_person: str
    email: EmailStr
    phone: str
    address: str

class B2BApplicationProcess(BaseModel):
    status: B2BStatus
    admin_notes: Optional[str] = None
    classification: Optional[UserTier] = UserTier.STANDARD

class PasswordReset(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    new_password: str

