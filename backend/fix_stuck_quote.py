import asyncio
import os
import sys

# Add current directory to path
sys.path.append(os.getcwd())

from app.database import init_db
from app.models.sales import SalesQuote, QuoteStatus

async def main():
    print("Initializing DB...")
    await init_db()
    
    quote_number = "CV-25-0001"
    print(f"Fetching quote {quote_number}...")
    quote = await SalesQuote.find_one(SalesQuote.quote_number == quote_number)
    
    if not quote:
        print("Quote not found!")
        return

    print(f"Current Status: {quote.status}")
    
    if quote.status == QuoteStatus.CONVERTED:
        print("Fixing status to ACCEPTED...")
        quote.status = QuoteStatus.ACCEPTED
        await quote.save()
        print("Done!")
    else:
        print("Quote is not in CONVERTED status, no action needed.")

if __name__ == "__main__":
    asyncio.run(main())
