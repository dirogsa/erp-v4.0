'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { BuildingStorefrontIcon, ShoppingCartIcon, AdjustmentsHorizontalIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function MarketplacePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (searchQuery = '') => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/marketplace/products?limit=50${searchQuery ? `&search=${searchQuery}` : ''}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching marketplace products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts(search);
  };

  const handleAddToCart = (product) => {
    addItem({
      sku: product.sku,
      name: product.name,
      brand: product.brand,
      price: product.price || 0,
      quantity: 1,
      is_marketplace: true,
      vendor_name: product.vendor_name
    });
    // Pequeño feedback visual o toast podría ir aquí
    alert(`${product.name} agregado a tu cotización.`);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      {/* HEADER EXCLUSIVO MARKETPLACE */}
      <div className="bg-[#12131A] border-b border-white/5 pt-24 pb-12 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-primary/10 rounded-full blur-[120px] opacity-30 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20 mb-6">
            <BuildingStorefrontIcon className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Red B2B de Proveedores</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
            Marketplace <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-emerald-400">Terceros</span>
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto text-lg mb-10">
            Descubre productos de nuestros partners autorizados. Solicita una cotización y nosotros nos encargamos de la gestión con el proveedor.
          </p>
          
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative group">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-white/40 group-focus-within:text-brand-primary transition-colors" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar repuestos de terceros, marcas o códigos..."
              className="w-full bg-[#1A1C23] border border-white/10 rounded-2xl py-4 pl-14 pr-32 text-white placeholder-white/30 focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/50 transition-all shadow-lg"
            />
            <button 
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-primary text-black font-bold px-6 py-2 rounded-xl hover:bg-brand-primary/90 transition-colors"
            >
              Buscar
            </button>
          </form>
        </div>
      </div>

      {/* PRODUCT GRID */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        {loading ? (
          <div className="flex justify-center items-center py-32">
            <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-32">
            <BuildingStorefrontIcon className="w-20 h-20 text-white/10 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">Aún no hay productos</h3>
            <p className="text-white/50">Los proveedores externos publicarán sus catálogos pronto.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.sku} className="bg-[#12131A] rounded-2xl border border-white/5 overflow-hidden hover:border-brand-primary/30 transition-all group flex flex-col relative shadow-xl">
                {/* Vendor Badge */}
                <div className="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-white/90 uppercase tracking-wider truncate max-w-[120px]">
                    {product.vendor_name}
                  </span>
                </div>

                {/* Image */}
                <div className="aspect-square bg-white/5 relative p-6 flex items-center justify-center">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="max-w-full max-h-full object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <BuildingStorefrontIcon className="w-24 h-24 text-white/10" />
                  )}
                </div>
                
                {/* Content */}
                <div className="p-5 flex flex-col flex-grow">
                  <div className="text-[10px] font-black text-brand-primary tracking-widest uppercase mb-2">
                    {product.brand}
                  </div>
                  <h3 className="text-white font-medium mb-1 line-clamp-2 leading-tight flex-grow text-sm">
                    {product.name}
                  </h3>
                  <div className="text-white/40 text-xs font-mono mb-4 bg-white/5 inline-block px-2 py-1 rounded w-fit">
                    SKU: {product.sku}
                  </div>
                  
                  <button 
                    onClick={() => handleAddToCart(product)}
                    className="w-full bg-white/5 hover:bg-brand-primary text-white hover:text-black border border-white/10 hover:border-transparent rounded-xl py-3 text-sm font-bold transition-all flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(37,211,102,0.2)]"
                  >
                    <ShoppingCartIcon className="w-5 h-5" />
                    Cotizar Ítem
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
