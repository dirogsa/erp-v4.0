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
                setBrands(brandRes.data.filter(b => b.is_popular));
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
        <div className="bg-slate-50 min-h-screen pb-20">
            <Header onSearch={(query) => console.log("Searching:", query)} />

            {/* Quick Filter Bar */}
            <div className="flex gap-3 overflow-x-auto px-4 py-4 no-scrollbar">
                <button
                    onClick={() => setSelectedBrand(null)}
                    className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap border-2 transition-all ${!selectedBrand ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200' : 'bg-white border-slate-100 text-slate-400'}`}
                >
                    Todos
                </button>
                {brands.map(brand => (
                    <button
                        key={brand.name}
                        onClick={() => setSelectedBrand(brand.name)}
                        className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap border-2 transition-all ${selectedBrand === brand.name ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200' : 'bg-white border-slate-100 text-slate-400'}`}
                    >
                        {brand.name}
                    </button>
                ))}
            </div>

            {/* Product Grid */}
            <div className="px-4 pb-10">
                <div className="flex justify-between items-end mb-4 px-1">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Catálogo</h2>
                        <p className="text-xs text-slate-400 font-bold">{filteredProducts.length} productos encontrados</p>
                    </div>
                    <button className="text-primary-600 text-xs font-black border-b-2 border-primary-100">Filtrar</button>
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
