import asyncio
import re
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient("mongodb+srv://db_user:Admin123!@erpcluster.zggrz5h.mongodb.net/?retryWrites=true&w=majority&appName=erpCluster")
    db = client["erp_db"]
    
    pipeline = [
        {"$unwind": "$specs"},
        {"$group": {"_id": "$specs.label", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    
    cursor = db.products.aggregate(pipeline)
    results = await cursor.to_list(length=None)
    
    word_and_letter = []
    only_letter = []
    only_word = []
    
    for r in results:
        label = r["_id"]
        if not label: continue
        label_str = str(label).strip()
        count = r["count"]
        
        # Check if it has a letter in parenthesis like (A), (H), etc.
        has_letter_in_parens = bool(re.search(r'\([A-Z]\)', label_str, re.IGNORECASE))
        is_only_letter = bool(re.fullmatch(r'[A-Z]', label_str, re.IGNORECASE))
        
        item = f"{label_str} (x{count})"
        if has_letter_in_parens:
            word_and_letter.append(item)
        elif is_only_letter:
            only_letter.append(item)
        else:
            only_word.append(item)
            
    print("=== PALABRA Y LETRA ===")
    for item in word_and_letter: print(item)
    print("\n=== SOLO LETRA ===")
    for item in only_letter: print(item)
    print("\n=== SOLO PALABRA ===")
    for item in only_word: print(item)

if __name__ == "__main__":
    asyncio.run(main())
