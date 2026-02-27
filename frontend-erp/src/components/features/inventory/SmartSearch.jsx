import React, { useState } from 'react';
import { useSmartSearch } from '../../hooks/useSmartSearch';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { inventoryService } from '../../services/api';
import ProductDetailsView from './ProductDetailsView';

const SmartSearch = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeQuery, setActiveQuery] = useState('');
    const [activeTab, setActiveTab] = useState('cross'); // 'local', 'cross', 'vehicles'
    const [selectedProduct, setSelectedProduct] = useState(null);

    const { data: results, isLoading, error } = useSmartSearch(activeQuery);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim().length >= 3) {
            setActiveQuery(searchTerm.trim());
        }
    };

    const renderLocalResults = () => {
        if (!results?.local_results?.length) return <p className="text-secondary">No se encontraron productos locales exactos.</p>;

        return (
            <div className="results-table-container">
                <table className="smart-table">
                    <thead>
                        <tr>
                            <th>SKU / Marca</th>
                            <th>Nombre del Producto</th>
                            <th>Equivalencias</th>
                            <th>Stock</th>
                            <th>Precio (Público)</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.local_results.map(prod => (
                            <tr key={prod.sku}>
                                <td>
                                    <div className="sku-brand">
                                        <span className="sku-text">{prod.sku}</span>
                                        <span className="brand-badge">{prod.brand}</span>
                                    </div>
                                </td>
                                <td>{prod.name}</td>
                                <td>
                                    <div className="equiv-tags">
                                        {prod.equivalences?.slice(0, 3).map((eq, idx) => (
                                            <span key={idx} className="equiv-tag">{eq.code}</span>
                                        ))}
                                        {prod.equivalences?.length > 3 && <span className="equiv-more">+{prod.equivalences.length - 3}</span>}
                                    </div>
                                </td>
                                <td>
                                    <span className={`stock-status ${prod.stock_current > 0 ? 'in-stock' : 'out-of-stock'}`}>
                                        {prod.stock_current > 0 ? `Disponible (${prod.stock_current})` : 'Agotado'}
                                    </span>
                                </td>
                                <td className="price-cell">S/ {prod.price_retail?.toFixed(2)}</td>
                                <td>
                                    <Button size="sm" onClick={() => setSelectedProduct(prod)}>Ver Detalles</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderExternalResults = () => {
        if (!results?.external_results?.length) {
            if (activeQuery && !isLoading) return <p className="text-secondary">No se encontraron cruces externos para "{activeQuery}".</p>;
            return <p className="text-secondary">Ingrese un código para buscar cruces en catálogos internacionales.</p>;
        }

        return (
            <div className="results-table-container">
                <table className="smart-table external">
                    <thead>
                        <tr>
                            <th>Número Externo</th>
                            <th>Fabricante / Marca</th>
                            <th>Fuente</th>
                            <th>Estado en Sistema</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.external_results.map((ext, idx) => (
                            <tr key={idx}>
                                <td className="highlight-cell">{ext.code}</td>
                                <td>{ext.brand}</td>
                                <td><span className="source-tag">{ext.source}</span></td>
                                <td>
                                    <div className="system-check">
                                        {/* Aquí podríamos hacer un check en tiempo real si el sistema tiene este código */}
                                        <span className="check-pending">Validar disponibilidad...</span>
                                    </div>
                                </td>
                                <td>
                                    <Button variant="secondary" size="sm">Importar como Equivalencia</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="smart-search-container">
            <div className="smart-search-header card">
                <div className="wix-style-header">
                    <div className="header-labels">
                        <span>Search</span>
                        <span>Enter your search term</span>
                    </div>
                    <form onSubmit={handleSearch} className="wix-search-bar">
                        <select className="search-mode-select">
                            <option>SmartSearch</option>
                            <option>SKU Exacto</option>
                            <option>OEM Number</option>
                        </select>
                        <div className="input-wrapper">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Ej: 7M51-9601-AC o WA9567"
                                className="wix-input"
                            />
                            {searchTerm && <button type="button" className="clear-btn" onClick={() => setSearchTerm('')}>×</button>}
                        </div>
                        <button type="submit" className="wix-search-btn">
                            {isLoading ? '...' : 'SEARCH'}
                        </button>
                    </form>
                </div>
            </div>

            {activeQuery && (
                <div className="search-results-section animate-fade-in">
                    <h2 className="results-title">Your search: <span className="query-highlight">{activeQuery}</span></h2>

                    <div className="wix-tabs">
                        <button
                            className={`wix-tab ${activeTab === 'local' ? 'active' : ''}`}
                            onClick={() => setActiveTab('local')}
                        >
                            Productos en Inventario ({results?.local_results?.length || 0})
                        </button>
                        <button
                            className={`wix-tab ${activeTab === 'cross' ? 'active' : ''}`}
                            onClick={() => setActiveTab('cross')}
                        >
                            Cross References ({results?.external_results?.length || 0})
                        </button>
                        <button
                            className={`wix-tab ${activeTab === 'vehicles' ? 'active' : ''}`}
                            onClick={() => setActiveTab('vehicles')}
                        >
                            Vehicle / Application (0)
                        </button>
                    </div>

                    <div className="results-content">
                        {isLoading ? (
                            <div className="loading-spinner-container">
                                <div className="spinner"></div>
                                <p>Buscando en catálogos globales...</p>
                            </div>
                        ) : (
                            <>
                                {activeTab === 'local' && renderLocalResults()}
                                {activeTab === 'cross' && renderExternalResults()}
                                {activeTab === 'vehicles' && <p className="text-secondary">Funcionalidad de aplicaciones próximamente.</p>}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Modal de Detalle de Producto */}
            {selectedProduct && (
                <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
                    <div className="modal-content wide" onClick={e => e.stopPropagation()}>
                        <ProductDetailsView
                            product={selectedProduct}
                            onClose={() => setSelectedProduct(null)}
                        />
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .smart-search-container {
                    padding: 1rem;
                    color: white;
                }
                .wix-style-header {
                    background: #111;
                    padding: 2rem;
                    border-radius: 0.5rem;
                }
                .header-labels {
                    display: flex;
                    gap: 5rem;
                    margin-bottom: 0.5rem;
                    font-size: 0.8rem;
                    color: #94a3b8;
                    padding-left: 1rem;
                }
                .wix-search-bar {
                    display: flex;
                    gap: 0;
                    border: 1px solid #334155;
                    border-radius: 4px;
                    overflow: hidden;
                }
                .search-mode-select {
                    background: #222;
                    border: none;
                    color: white;
                    padding: 1rem;
                    border-right: 1px solid #334155;
                    width: 200px;
                    cursor: pointer;
                }
                .input-wrapper {
                    flex: 1;
                    position: relative;
                    display: flex;
                    align-items: center;
                    background: #222;
                }
                .wix-input {
                    background: transparent;
                    border: none;
                    color: white;
                    padding: 1.2rem;
                    font-size: 1.2rem;
                    width: 100%;
                    outline: none !important;
                }
                .clear-btn {
                    position: absolute;
                    right: 1rem;
                    background: none;
                    border: none;
                    color: #94a3b8;
                    font-size: 1.5rem;
                    cursor: pointer;
                }
                .wix-search-btn {
                    background: #ffc107;
                    border: none;
                    color: black;
                    padding: 0 3rem;
                    font-weight: bold;
                    font-size: 1.1rem;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .wix-search-btn:hover {
                    background: #e0ac07;
                }
                
                .results-title {
                    font-size: 1.8rem;
                    margin: 2rem 0;
                }
                .query-highlight {
                    color: #ffc107;
                }
                
                .wix-tabs {
                    display: flex;
                    gap: 2rem;
                    border-bottom: 1px solid #334155;
                    margin-bottom: 2rem;
                }
                .wix-tab {
                    background: none;
                    border: none;
                    color: #94a3b8;
                    padding: 1rem 0;
                    cursor: pointer;
                    font-size: 1.1rem;
                    font-weight: 500;
                    position: relative;
                }
                .wix-tab.active {
                    color: white;
                }
                .wix-tab.active::after {
                    content: '';
                    position: absolute;
                    bottom: -1px;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: #ffc107;
                }
                
                .smart-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .smart-table th {
                    background: #ffc107;
                    color: black;
                    text-align: left;
                    padding: 1rem;
                    text-transform: uppercase;
                    font-size: 0.85rem;
                }
                .smart-table td {
                    padding: 1.2rem 1rem;
                    border-bottom: 1px solid #334155;
                    background: #1e293b;
                }
                .highlight-cell {
                    color: #ffc107;
                    font-weight: bold;
                    font-size: 1.1rem;
                }
                .source-tag {
                    background: #334155;
                    padding: 0.2rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.8rem;
                }
                
                .sku-brand {
                    display: flex;
                    flex-direction: column;
                    gap: 0.2rem;
                }
                .sku-text {
                    font-weight: bold;
                    color: #ffc107;
                }
                .brand-badge {
                    font-size: 0.75rem;
                    color: #94a3b8;
                }
                .stock-status {
                    font-size: 0.9rem;
                    padding: 0.3rem 0.6rem;
                    border-radius: 1rem;
                }
                .in-stock {
                    background: rgba(16, 185, 129, 0.1);
                    color: #10b981;
                }
                .out-of-stock {
                    background: rgba(244, 63, 94, 0.1);
                    color: #f43f5e;
                }
                .price-cell {
                    font-weight: bold;
                    font-size: 1.1rem;
                }
                
                .animate-fade-in {
                    animation: fadeIn 0.4s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .loading-spinner-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 4rem;
                    gap: 1rem;
                    color: #94a3b8;
                }
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #334155;
                    border-top: 4px solid #ffc107;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .modal-content.wide {
                    max-width: 1000px;
                    width: 95%;
                }
            `}} />
        </div>
    );
};

export default SmartSearch;
