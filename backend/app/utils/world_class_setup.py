import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.getcwd())

from app.database import init_db
from app.models.company import Company
from app.models.auth import User
from app.models.sales import SalesPolicy
from app.utils.seed_master_data import seed_professional_categories

async def setup_world_class_erp():
    await init_db()
    
    print("--- 1. Setting up Companies ---")
    companies_data = [
        {"name": "DIROGSA", "ruc": "20601234567"},
        {"name": "JEEF", "ruc": "20609876543"}
    ]
    
    company_ids = []
    for c_data in companies_data:
        c = await Company.find_one(Company.ruc == c_data["ruc"])
        if not c:
            c = Company(**c_data)
            await c.insert()
            print(f"Created company: {c.name}")
        else:
            print(f"Company {c.name} already exists")
        company_ids.append(str(c.id))

    print("\n--- 2. Setting up User Context ---")
    # Update all admin users to have access to these companies
    users = await User.find_all().to_list()
    for u in users:
        u.assigned_companies = company_ids
        if not u.current_company_id:
            u.current_company_id = company_ids[0]
        await u.save()
        print(f"Updated user {u.username} with access to {len(company_ids)} companies")

    print("\n--- 3. Seeding Professional Master Data ---")
    for cid in company_ids:
        await seed_professional_categories(cid)
        
        # Initialize SalesPolicy for each company
        policy = await SalesPolicy.find_one(SalesPolicy.company_id == cid)
        if not policy:
            policy = SalesPolicy(company_id=cid)
            await policy.insert()
            print(f"Initialized SalesPolicy for company ID: {cid}")
    
    print("\nSetup complete! Your ERP is now World-Class Multi-tenant.")

if __name__ == "__main__":
    asyncio.run(setup_world_class_erp())
