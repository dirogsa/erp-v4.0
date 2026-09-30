'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';
import TrackingLink from '@/components/TrackingLink';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

export default function MobileBottomCartLink() {
  const { items } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const itemCount = mounted ? items.reduce((total, item) => total + item.quantity, 0) : 0;

  return (
    <TrackingLink 
      href="/cart" 
      eventName="view_cart" 
      className="relative flex flex-col items-center justify-center gap-1 w-14 h-12 text-white/40 active:text-white transition-colors group" 
      aria-label="Cotización"
    >
      <span className="sr-only">Mi lista de cotización</span>
      <div className="relative">
        <ShoppingCartIcon className={`h-6 w-6 transition-transform group-active:scale-90 ${itemCount > 0 ? 'text-brand-primary' : ''}`} />
        {itemCount > 0 && (
          <div className="absolute -top-1.5 -right-2 bg-brand-primary text-[#0A0A0B] text-[10px] font-black h-4 min-w-[16px] flex items-center justify-center rounded-full px-1 shadow-[0_0_8px_rgba(16,185,129,0.5)]">
            {itemCount}
          </div>
        )}
      </div>
    </TrackingLink>
  );
}
