from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from app.models.company import Company
from datetime import datetime

router = APIRouter(prefix="/companies", tags=["Companies"])

class CompanyCreate(BaseModel):
    name: str
    ruc: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    bank_name: Optional[str] = None
    account_soles: Optional[str] = None
    account_dollars: Optional[str] = None

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    ruc: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    bank_name: Optional[str] = None
    account_soles: Optional[str] = None
    account_dollars: Optional[str] = None

@router.get("/", response_model=List[Company])
async def get_companies():
    return await Company.find_all().to_list()

@router.post("/", response_model=Company, status_code=status.HTTP_201_CREATED)
async def create_company(data: CompanyCreate):
    # Check if RUC exists
    existing = await Company.find_one(Company.ruc == data.ruc)
    if existing:
        raise HTTPException(status_code=400, detail="Company with this RUC already exists")
    
    company = Company(**data.dict())
    await company.insert()
    return company

@router.put("/{company_id}", response_model=Company)
async def update_company(company_id: str, data: CompanyUpdate):
    company = await Company.get(company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    update_data['updated_at'] = datetime.now()
    
    await company.set(update_data)
    return company

@router.delete("/{company_id}")
async def delete_company(company_id: str):
    company = await Company.get(company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    await company.delete()
    return {"message": "Company deleted"}
