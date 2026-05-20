import asyncio
from app.models.inventory import Product
from app.utils.norm_utils import canonical_sku

async def backfill_sku_canonical():
    """Iterate all products and set sku_canonical based on current sku.
    This should be run once after deployment of the new field.
    """
    async for product in Product.find({}):
        if not product.sku:
            continue
        canonical = canonical_sku(product.sku)
        # Only update if different or missing
        if getattr(product, 'sku_canonical', None) != canonical:
            product.sku_canonical = canonical
            await product.save()
    print('Backfill completed: sku_canonical set for all products')

# Entry point for manual execution
if __name__ == '__main__':
    asyncio.run(backfill_sku_canonical())
