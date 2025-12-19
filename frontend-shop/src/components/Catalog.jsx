import React, { useState, useEffect } from 'react';
import { shopService } from '../services/api';
import ProductCard from './ProductCard';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

const Catalog = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        loadData();
    }, [selectedCategory]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [prodRes, catRes] = await Promise.all([
                shopService.getProducts({ search, category: selectedCategory }),
                shopService.getCategories()
            ]);
            setProducts(prodRes.data.items || []);
            setCategories(catRes.data || []);
        } catch (error) {
            console.error("[Catalog] Error loading catalog:", error);
            console.error("[Catalog] Error response:", error.response?.data);
            console.error("[Catalog] Error status:", error.response?.status);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        loadData();
    };

    return (
        <section className="py-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 mb-2">Nuestro Catálogo</h2>
                    <p className="text-slate-500">Encuentra los mejores repuestos para tu vehículo</p>
                </div>

                <div className="flex w-full md:w-auto gap-2">
                    <form onSubmit={handleSearch} className="relative flex-1 md:w-80">
                        <input
                            type="text"
                            placeholder="Buscar por SKU o nombre..."
                            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3 pr-12 focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button type="submit" className="absolute right-4 top-3.5 text-slate-400 hover:text-primary-600 transition-colors">
                            <MagnifyingGlassIcon className="h-5 w-5" />
                        </button>
                    </form>

                    <select
                        className="bg-white border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="">Todas las Categorías</option>
                        {categories.map(cat => (
                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {products.length > 0 ? (
                        products.map((product) => (
                            <ProductCard key={product.sku} product={product} onAddToCart={() => { }} />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 bg-slate-50 rounded-3xl">
                            <p className="text-slate-500">No se encontraron productos.</p>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default Catalog;
