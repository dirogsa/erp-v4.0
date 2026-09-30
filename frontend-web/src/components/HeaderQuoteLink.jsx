'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';

export default function HeaderQuoteLink() {
  const { items } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-transparent text-white/50 h-[42px] w-32 animate-pulse" />
    );
  }

  return (
    <Link 
      href="/cart" 
      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-white/90" 
      aria-label="Mi Cotización"
    >
      <span className="text-lg leading-none">📋</span>
      <span className="text-sm font-bold">
        Mi cotización {itemCount > 0 && <span className="text-brand-primary">({itemCount})</span>}
      </span>
    </Link>
  );
}
