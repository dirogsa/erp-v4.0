code = """

class SalesPolicy(Document):
    \"\"\"
    Per-company commercial policy configuration.
    Stores surcharges for credit terms and volume discounts.
    \"\"\"
    company_id: str = ""
    cash_discount: float = 0.0
    credit_30_days: float = 3.0
    credit_60_days: float = 5.0
    credit_90_days: float = 8.0
    credit_180_days: float = 12.0
    min_margin_guard_pct: float = 12.0
    vol_3_discount_pct: float = 0.0
    vol_6_discount_pct: float = 0.0
    vol_12_discount_pct: float = 0.0
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    updated_by: Optional[str] = None

    class Settings:
        name = "sales_policies"
"""

target = "app/models/sales.py"

with open(target, "r", encoding="utf-8") as f:
    content = f.read()

if "class SalesPolicy" in content:
    print("SalesPolicy already exists, skipping.")
else:
    with open(target, "a", encoding="utf-8") as f:
        f.write(code)
    print("SalesPolicy restored successfully.")
