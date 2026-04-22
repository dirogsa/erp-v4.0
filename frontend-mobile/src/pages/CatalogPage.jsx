import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import MobileProductCard from '../components/MobileProductCard';
import { shopService } from '../services/api';

const CatalogPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [brands, setBrands] = useState([]);
    const [selectedBrand, setSelectedBrand] = useState(null);

    useEffect(() => {
        // Fetch products and brands
        const fetchData = async () => {
            try {
                const [prodRes, brandRes] = await Promise.all([
                    shopService.getProducts(),
                    shopService.getVehicleBrands()
                ]);
                setProducts(prodRes.data.items || []);
                const rawBrands = brandRes.data;
                const groups = {};
                rawBrands.forEach(b => {
                    const name = b.name.toUpperCase().trim();
                    const parent = b.parent_name ? b.parent_name.toUpperCase().trim() : null;
                    const displayName = parent || name;
                    
                    if (!groups[displayName]) {
                        groups[displayName] = { name: displayName, is_popular: false };
                    }
                    if (b.is_popular) groups[displayName].is_popular = true;
                });
                
                const topBrands = Object.values(groups)
                    .filter(b => b.is_popular)
                    .sort((a, b) => a.name.localeCompare(b.name));
                    
                setBrands(topBrands);
            } catch (error) {
                console.error("Error loading catalog", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredProducts = selectedBrand
        ? products.filter(p => p.brand === selectedBrand)
        : products;

    return (
        <div className="bg-brand-bg min-h-screen pb-20">
            <Header onSearch={(query) => console.log("Searching:", query)} />

            {/* Quick Filter Bar */}
            <div className="flex gap-4 overflow-x-auto px-6 py-6 no-scrollbar">
                <button
                    onClick={() => setSelectedBrand(null)}
                    className={`px-8 py-3 rounded-2xl text-brand-xs font-black uppercase tracking-widest whitespace-nowrap border-2 transition-all shadow-xl ${!selectedBrand ? 'bg-brand-primary border-brand-primary text-brand-bg' : 'bg-brand-surface border-brand-border text-brand-text-muted'}`}
                >
                    Todos
                </button>
                {brands.map(brand => (
                    <button
                        key={brand.name}
                        onClick={() => setSelectedBrand(brand.name)}
                        className={`px-8 py-3 rounded-2xl text-brand-xs font-black uppercase tracking-widest whitespace-nowrap border-2 transition-all shadow-xl ${selectedBrand === brand.name ? 'bg-brand-primary border-brand-primary text-brand-bg' : 'bg-brand-surface border-brand-border text-brand-text-muted'}`}
                    >
                        {brand.name}
                    </button>
                ))}
            </div>

            {/* Product Grid */}
            <div className="px-4 pb-10">
                <div className="flex justify-between items-end mb-8 px-2">
                    <div>
                        <h2 className="text-brand-heading">Catálogo</h2>
                        <p className="text-brand-metadata mt-1">{filteredProducts.length} productos encontrados</p>
                    </div>
                    <button className="text-brand-primary text-brand-xs font-black border-b-2 border-brand-primary/20 pb-1">Filtrar</button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 gap-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white rounded-2xl h-64 animate-pulse border border-slate-100"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {filteredProducts.map(product => (
                            <MobileProductCard
                                key={product.sku}
                                product={product}
                                onAddToCart={(p) => console.log("Added:", p.sku)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CatalogPage;
