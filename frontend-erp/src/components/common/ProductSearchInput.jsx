import React, { useState, useEffect, useRef } from 'react';
import { inventoryService } from '../../services/api';
import Input from './Input';

const ProductSearchInput = ({ onSelect, label = "Producto", placeholder = "Buscar producto..." }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const wrapperRef = useRef(null);

    const ignoreNextSearch = useRef(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (ignoreNextSearch.current) {
                ignoreNextSearch.current = false;
                return;
            }

            if (searchTerm.length >= 3) {
                setLoading(true);
                try {
                    const response = await inventoryService.getProducts(1, 10, searchTerm);
                    setResults(response.data.items);
                    setShowDropdown(true);
                } catch (error) {
                    console.error("Error searching products:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
                setShowDropdown(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (product) => {
        ignoreNextSearch.current = true;
        setSearchTerm(product.sku);
        onSelect(product);
        setResults([]);
        setShowDropdown(false);
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative' }}>
            <Input
                label={label}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={placeholder}
                autoComplete="off"
            />

            {showDropdown && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '0.5rem',
                    marginTop: '0.25rem',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    zIndex: 50,
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                }}>
                    {loading ? (
                        <div style={{ padding: '1rem', color: '#94a3b8', textAlign: 'center' }}>
                            Buscando...
                        </div>
                    ) : results.length > 0 ? (
                        results.map(product => (
                            <div
                                key={product.sku}
                                onClick={() => handleSelect(product)}
                                style={{
                                    padding: '0.75rem 1rem',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #334155',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0f172a'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <div style={{ color: 'white', fontWeight: '500' }}>
                                    {product.name}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#94a3b8' }}>
                                    <span>SKU: {product.sku}</span>
                                    <span>Stock: {product.stock_current}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '1rem', color: '#94a3b8', textAlign: 'center' }}>
                            No se encontraron productos
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProductSearchInput;
