'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';

export default function MobileQuoteBar() {
  const { items } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || items.length === 0) return null;

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="fixed bottom-[72px] md:hidden left-4 right-4 z-50 animate-fade-in-up">
      <Link 
        href="/cart"
        className="w-full bg-brand-primary text-[#0A0A0B] rounded-xl px-4 py-3 flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:brightness-110 active:scale-[0.98] transition-all"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl leading-none">📋</span>
          <div className="flex flex-col">
            <span className="text-sm font-black uppercase tracking-widest leading-none mb-0.5">
              Mi Cotización
            </span>
            <span className="text-[10px] font-bold text-[#0A0A0B]/70 uppercase">
              {itemCount} producto{itemCount !== 1 && 's'} agregado{itemCount !== 1 && 's'}
            </span>
          </div>
        </div>
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </Link>
    </div>
  );
}
