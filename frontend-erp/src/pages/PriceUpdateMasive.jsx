import React, { useState, useEffect } from 'react';
import { inventoryService, salesPolicyService, priceService, pricingService, categoryService, brandService } from '../services/api';
import ProductSearchInput from '../components/common/ProductSearchInput';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useNotification } from '../hooks/useNotification';
import PriceImportModal from '../components/features/admin/PriceImportModal';
import { dataExchangeService } from '../services/api';

const PriceUpdateMasive = () => {
    const { showNotification } = useNotification();
    const [items, setItems] = useState([]);
    const [policies, setPolicies] = useState(null);
    const [priceType, setPriceType] = useState('price_retail'); // 'price_retail' o 'price_wholesale'
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [b2bRules, setB2bRules] = useState([]);
    const [categories, setCategories] = useState([]);

    // Simulation State
    const [simTier, setSimTier] = useState('STANDARD');
    const [simQty, setSimQty] = useState(1);

    // Multinational / Enterprise State
    const [filters, setFilters] = useState({ category: '', brand: '', hasStock: false });
    const [autoRelational, setAutoRelational] = useState(true);
    const [brands, setBrands] = useState([]);
    const [updateReason, setUpdateReason] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [policiesRes, rulesRes, catsRes, brandsRes] = await Promise.all([
                    salesPolicyService.getPolicies(),
                    pricingService.getRules(),
                    categoryService.getCategories(),
                    brandService.getBrands()
                ]);
                setPolicies(policiesRes.data);
                setB2bRules(rulesRes.data);
                setCategories(catsRes.data);
                setBrands(brandsRes.data);
            } catch (error) {
                showNotification('Error al cargar datos corporativos', 'error');
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, []);

    const handleAddProduct = (product) => {
        if (items.find(i => i.sku === product.sku)) {
            showNotification('El producto ya está en la lista', 'warning');
            return;
        }

        const newItem = {
            sku: product.sku,
            name: product.name,
            price_retail: product.price_retail || 0,
            price_wholesale: product.price_wholesale || 0,
            old_retail: product.price_retail || 0,
            old_wholesale: product.price_wholesale || 0,
            stock_current: product.stock_current,
            category_id: product.category_id,
            brand: product.brand,
            isModified: false,
            cost: product.cost || 0,
            discount_6_pct: product.discount_6_pct || 0,
            discount_12_pct: product.discount_12_pct || 0,
            discount_24_pct: product.discount_24_pct || 0
        };
        setItems(prev => [newItem, ...prev]);
    };

    const handleImported = (imported) => {
        setItems(prev => {
            const newList = [...prev];
            imported.forEach(imp => {
                const existingIdx = newList.findIndex(item => item.sku === imp.sku);
                if (existingIdx > -1) {
                    newList[existingIdx] = { ...newList[existingIdx], ...imp };
                } else {
                    newList.push(imp);
                }
            });
            return newList;
        });
        showNotification(`Se cargaron ${imported.length} productos a la lista`, 'success');
    };

    const handleExport = async () => {
        try {
            const response = await dataExchangeService.exportEntity('products');
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `productos_precios_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            showNotification('Error al exportar productos', 'error');
        }
    };

    const handleUpdateItemPrice = (sku, field, value) => {
        setItems(prev => prev.map(item => {
            if (item.sku !== sku) return item;

            const newVal = parseFloat(value) || 0;
            let updatedItem = { ...item, [field]: newVal, isModified: true };

            // RELATIONAL ENGINE LOGIC
            if (autoRelational && field === 'price_wholesale') {
                // 1. Calculate Retail from Wholesale Anchor
                const markup = policies?.retail_markup_pct || 20;
                updatedItem.price_retail = parseFloat((newVal * (1 + markup / 100)).toFixed(3));

                // 2. Sync Volume Discounts from Global Policies
                updatedItem.discount_6_pct = policies?.vol_6_discount_pct || 0;
                updatedItem.discount_12_pct = policies?.vol_12_discount_pct || 0;
                updatedItem.discount_24_pct = policies?.vol_24_discount_pct || 0;
            }

            return updatedItem;
        }));
    };

    const handleSyncGlobalPolicies = () => {
        if (!policies) return;
        setItems(prev => prev.map(item => ({
            ...item,
            price_retail: parseFloat((item.price_wholesale * (1 + (policies.retail_markup_pct || 0) / 100)).toFixed(3)),
            discount_6_pct: policies.vol_6_discount_pct || 0,
            discount_12_pct: policies.vol_12_discount_pct || 0,
            discount_24_pct: policies.vol_24_discount_pct || 0,
            isModified: true
        })));
        showNotification('Lista sincronizada con políticas globales', 'info');
    };

    const calculateTermPrice = (basePrice, surcharge) => {
        return (basePrice * (1 + surcharge / 100)).toFixed(3);
    };

    const getEffectivePrice = (item, type, tier, qty) => {
        let price = item[type];

        // 1. Apply Volume Discount (If type is retail)
        if (type === 'price_retail') {
            if (qty >= 24) price *= (1 - (item.discount_24_pct || 0) / 100);
            else if (qty >= 12) price *= (1 - (item.discount_12_pct || 0) / 100);
            else if (qty >= 6) price *= (1 - (item.discount_6_pct || 0) / 100);
        }

        // 2. Apply B2B Tier Discount
        if (tier !== 'STANDARD') {
            // Find applicable rules
            const applicableRule = b2bRules.find(r =>
                r.is_active &&
                r.tier === tier &&
                (!r.category_id || r.category_id === item.category_id) &&
                (!r.brand || r.brand === item.brand)
            );

            if (applicableRule) {
                price *= (1 - applicableRule.discount_percentage / 100);
            }
        }

        return price;
    };

    const getProfitMargin = (price, cost) => {
        if (!price || price <= 0) return 0;
        return ((price - cost) / price) * 100;
    };

    const handleRemoveItem = (sku) => {
        setItems(prev => prev.filter(i => i.sku !== sku));
    };

    const handleSaveAll = async () => {
        if (items.length === 0 || saving) return;
        setSaving(true);
        try {
            const updates = items.map(item => ({
                sku: item.sku,
                price: item.price_retail,
                price_wholesale: item.price_wholesale
            }));

            await priceService.bulkUpdate(updates, updateReason);
            showNotification(`Se actualizaron ${items.length} productos correctamente`, 'success');
            setItems([]);
        } catch (error) {
            showNotification('Error en la actualización masiva', 'error');
        } finally {
            setSaving(false);
        }
    };

    // --- ARCHITECTURAL COMMAND ENGINE ---
    const executeAction = (actionType, payload) => {
        setItems(prev => prev.map(item => {
            let newItem = { ...item };
            const currentVal = newItem[priceType];

            switch (actionType) {
                case 'PERCENTAGE':
                    newItem[priceType] = parseFloat((currentVal * (1 + payload / 100)).toFixed(3));
                    newItem.isModified = true;
                    break;
                case 'ROUND_PSYCHOLOGICAL':
                    // Rounds to .90
                    newItem[priceType] = Math.max(0, Math.ceil(currentVal) - 0.10);
                    newItem.isModified = true;
                    break;
                case 'SYNC_WHOLESALE':
                    // Wholesale = Retail - X%
                    if (priceType === 'price_retail') {
                        newItem.price_wholesale = parseFloat((newItem.price_retail * (1 - payload / 100)).toFixed(3));
                        newItem.isModified = true;
                    }
                    break;
                case 'SYNC_RETAIL':
                    // Retail = Wholesale + X%
                    if (priceType === 'price_wholesale') {
                        newItem.price_retail = parseFloat((newItem.price_wholesale * (1 + payload / 100)).toFixed(3));
                        newItem.isModified = true;
                    }
                    break;
                case 'SET_MARGIN':
                    // Price = Cost / (1 - Margin/100)
                    if (newItem.cost > 0) {
                        const targetMargin = parseFloat(payload) / 100;
                        newItem[priceType] = parseFloat((newItem.cost / (1 - targetMargin)).toFixed(3));
                        newItem.isModified = true;
                    }
                    break;
                default: break;
            }
            return newItem;
        }));
        showNotification('Acción ejecutada sobre la lista', 'info');
    };

    const loadByFilters = async () => {
        setLoading(true);
        try {
            // Load by criteria using inventory service
            const res = await inventoryService.getProducts(1, 100, '', filters.category, '');
            let products = res.data.items;

            if (filters.brand) {
                products = products.filter(p => p.brand === filters.brand);
            }
            if (filters.hasStock) {
                products = products.filter(p => p.stock_current > 0);
            }

            const mapped = products.map(p => ({
                sku: p.sku,
                name: p.name,
                price_retail: p.price_retail || 0,
                price_wholesale: p.price_wholesale || 0,
                old_retail: p.price_retail || 0,
                old_wholesale: p.price_wholesale || 0,
                cost: p.cost || 0,
                stock_current: p.stock_current,
                category_id: p.category_id,
                brand: p.brand,
                isModified: false
            }));

            setItems(prev => {
                const existingSkus = new Set(prev.map(i => i.sku));
                const uniqueNew = mapped.filter(m => !existingSkus.has(m.sku));
                return [...prev, ...uniqueNew];
            });

            setIsFilterOpen(false);
            showNotification(`Cargados ${mapped.length} productos según filtros`, 'success');
        } catch (err) {
            showNotification('Error al cargar productos por filtro', 'error');
        } finally {
            setLoading(false);
        }
    };

    const applyBulkPercentage = (pct) => {
        const factor = 1 + (parseFloat(pct) / 100);
        setItems(prev => prev.map(item => ({
            ...item,
            [priceType]: parseFloat((item[priceType] * factor).toFixed(3))
        })));
        showNotification(`Se aplicó un ${pct}% a todos los productos en lista`, 'info');
    };

    const loadEmptyPrices = async () => {
        setLoading(true);
        try {
            const res = await priceService.getIncompletePrices(); // Assuming this endpoint exists or filter in frontend
            const newItems = res.data.map(p => ({
                sku: p.sku,
                name: p.name,
                price_retail: p.price_retail || 0,
                price_wholesale: p.price_wholesale || 0,
                old_retail: p.price_retail || 0,
                old_wholesale: p.price_wholesale || 0,
                cost: p.cost || 0,
                stock_current: p.stock_current,
                brand: p.brand,
                category_id: p.category_id,
                isModified: false
            }));
            setItems(newItems);
            showNotification(`Se cargaron ${newItems.length} productos sin precio`, 'success');
        } catch (error) {
            // Fallback if special endpoint doesn't exist: load first page of all prices
            const res = await priceService.getProductsWithPrices(1, 100);
            const newItems = res.data.items.map(p => ({
                sku: p.sku,
                name: p.name,
                price_retail: p.price_retail || 0,
                price_wholesale: p.price_wholesale || 0,
                old_retail: p.price_retail || 0,
                old_wholesale: p.price_wholesale || 0,
                cost: p.cost || 0,
                stock_current: p.stock_current,
                brand: p.brand,
                category_id: p.category_id,
                isModified: false
            }));
            setItems(newItems);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem', color: 'white' }}>Cargando motor de precios...</div>;

    // Security Guard: Critical Risk Calculation
    const securityMargin = policies?.min_margin_guard_pct || 12;
    const hasCriticalRisk = items.some(item => {
        const effective = getEffectivePrice(item, priceType, simTier, simQty);
        const cost = item.cost || 0;
        if (cost <= 0) return false;

        const margin = ((effective - cost) / cost) * 100;
        return margin < securityMargin;
    });

    return (
        <div style={{ padding: '2rem' }}>
            <header style={{
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#1e293b',
                padding: '1.25rem',
                borderRadius: '0.75rem',
                border: '1px solid #334155'
            }}>
                <div>
                    <h1 style={{ color: 'white', margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
                        Gestión de Precios Global
                    </h1>
                    <p style={{ color: '#94a3b8', margin: 0, marginTop: '0.25rem', fontSize: '0.9rem' }}>Centro de control financiero</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Button variant="secondary" onClick={() => setShowImportModal(true)}>
                        📤 Importar Excel
                    </Button>

                    <div style={{ height: '32px', width: '1px', background: '#334155' }}></div>

                    <Input
                        placeholder="Razón del cambio (Auditoría)..."
                        value={updateReason}
                        onChange={(e) => setUpdateReason(e.target.value)}
                        style={{ width: '250px' }}
                    />

                    <Button
                        onClick={handleSaveAll}
                        loading={saving}
                        disabled={items.length === 0 || saving || hasCriticalRisk}
                        variant={hasCriticalRisk ? 'danger' : 'primary'}
                    >
                        {hasCriticalRisk ? '🚨 RIESGO DETECTADO' : `Publicar ${items.length} Cambios`}
                    </Button>
                </div>
            </header>

            {/* Filter Sidebar / Drawer Overlay */}
            {isFilterOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 3000,
                    display: 'flex', justifyContent: 'flex-end'
                }}>
                    <div style={{
                        width: '400px', backgroundColor: '#0f172a', height: '100%',
                        padding: '2rem', borderLeft: '1px solid #334155',
                        display: 'flex', flexDirection: 'column', gap: '1.5rem'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ color: 'white', margin: 0 }}>Filtros de Carga Masiva</h3>
                            <button onClick={() => setIsFilterOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>

                        <div>
                            <label style={{ color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>Categoría</label>
                            <select
                                value={filters.category}
                                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#1e293b', color: 'white', border: '1px solid #334155' }}
                            >
                                <option value="">Todas las categorías</option>
                                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label style={{ color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>Marca</label>
                            <select
                                value={filters.brand}
                                onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#1e293b', color: 'white', border: '1px solid #334155' }}
                            >
                                <option value="">Todas las marcas</option>
                                {brands.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                            </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input
                                type="checkbox"
                                checked={filters.hasStock}
                                onChange={(e) => setFilters({ ...filters, hasStock: e.target.checked })}
                                id="hasStock"
                            />
                            <label htmlFor="hasStock" style={{ color: '#94a3b8' }}>Solo con Stock disponible</label>
                        </div>

                        <Button onClick={loadByFilters} style={{ marginTop: 'auto' }}>
                            📂 Cargar Productos a la Grilla
                        </Button>
                    </div>
                </div>
            )}

            {/* Toolbar Unificada */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem',
                alignItems: 'center',
                backgroundColor: '#0f172a',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #334155'
            }}>
                {/* Search / Add */}
                <div style={{ flex: 1 }}>
                    <Button variant="secondary" onClick={() => setIsFilterOpen(true)} style={{ width: '100%', justifyContent: 'space-between', border: '1px dashed #475569' }}>
                        <span>🔍 Agregar Productos Manualmente / Filtros</span>
                        <span style={{ background: '#334155', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem' }}>CMD+K</span>
                    </Button>
                </div>

                {/* Vertical Divider */}
                <div style={{ width: '1px', height: '24px', backgroundColor: '#334155' }}></div>

                {/* Configuración de Cálculo (Relational Mode) */}
                <label style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
                    color: autoRelational ? '#3b82f6' : '#94a3b8', fontWeight: '500',
                    fontSize: '0.9rem', userSelect: 'none'
                }}>
                    <input
                        type="checkbox"
                        checked={autoRelational}
                        onChange={(e) => setAutoRelational(e.target.checked)}
                        style={{ accentColor: '#3b82f6' }}
                    />
                    <span>{autoRelational ? '⚡ Autocalcular Márgenes (Automático)' : '📝 Manual (Excel Manda)'}</span>
                </label>

                {/* Vertical Divider */}
                <div style={{ width: '1px', height: '24px', backgroundColor: '#334155' }}></div>

                {/* Selector de Vista Principal */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Columna Editable:</span>
                    <select
                        value={priceType}
                        onChange={(e) => setPriceType(e.target.value)}
                        style={{
                            background: '#1e293b',
                            border: 'none',
                            color: 'white',
                            padding: '0.4rem',
                            borderRadius: '0.25rem',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="price_retail">Precios Minoristas</option>
                        <option value="price_wholesale">Precios Mayoristas</option>
                    </select>
                </div>
            </div>

            <PriceImportModal
                visible={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImported={handleImported}
            />

            <div className="card">
                <div className="table-responsive">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #334155' }}>
                                <th style={{ padding: '1rem', color: '#94a3b8' }}>Producto</th>
                                <th style={{ padding: '1rem', color: '#94a3b8', textAlign: 'right' }}>
                                    {priceType === 'price_retail' ? 'Ref. Mayorista' : 'Ref. Minorista'}
                                </th>
                                <th style={{ padding: '1rem', color: '#3b82f6', textAlign: 'center' }}>
                                    {priceType === 'price_retail' ? 'P. Minorista (EDITA AQUÍ)' : 'P. Mayorista (EDITA AQUÍ)'}
                                </th>
                                <th style={{ padding: '1rem', color: '#10b981', textAlign: 'center' }}>Margen (%)</th>
                                <th style={{ padding: '1rem', color: '#94a3b8', background: 'rgba(59, 130, 246, 0.05)' }}>30d (+{policies?.credit_30_days || 0}%)</th>
                                <th style={{ padding: '1rem', color: '#94a3b8', background: 'rgba(59, 130, 246, 0.05)' }}>60d (+{policies?.credit_60_days || 0}%)</th>
                                <th style={{ padding: '1rem', color: '#94a3b8', background: 'rgba(59, 130, 246, 0.05)' }}>90d (+{policies?.credit_90_days || 0}%)</th>
                                <th style={{ padding: '1rem', color: '#94a3b8', background: 'rgba(59, 130, 246, 0.05)' }}>180d (+{policies?.credit_180_days || 0}%)</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => {
                                const effectivePrice = getEffectivePrice(item, priceType, simTier, simQty);
                                const isDiscounted = effectivePrice < item[priceType];
                                const currentMargin = item.cost > 0 ? ((effectivePrice - item.cost) / item.cost) * 100 : 100;
                                const isRisk = item.cost > 0 && currentMargin < securityMargin;

                                return (
                                    <tr key={item.sku} style={{
                                        borderBottom: '1px solid #1e293b',
                                        backgroundColor: isRisk ? 'rgba(239, 68, 68, 0.15)' : (item.isModified ? 'rgba(59, 130, 246, 0.05)' : 'transparent')
                                    }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ color: 'white', fontWeight: '600' }}>{item.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                SKU: {item.sku} | {item.brand}
                                                {item.isModified && <span style={{ marginLeft: '0.5rem', color: '#3b82f6', fontWeight: 'bold' }}>[Editado]</span>}
                                                {isDiscounted && <span style={{ marginLeft: '0.5rem', color: '#10b981', fontWeight: 'bold' }}>[Simulado]</span>}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', verticalAlign: 'middle', borderLeft: '1px solid #1e293b' }}>
                                            <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500' }}>
                                                S/ {(priceType === 'price_retail' ? item.price_wholesale : item.price_retail).toFixed(3)}
                                            </div>
                                            <div style={{ fontSize: '0.6rem', color: '#475569', textTransform: 'uppercase' }}>
                                                {priceType === 'price_retail' ? 'Actual Mayorista' : 'Actual Minorista'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', width: '220px', backgroundColor: 'rgba(59, 130, 246, 0.02)' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.2rem' }}>
                                                    {(priceType === 'price_retail' ? item.old_retail : item.old_wholesale) === 0 ? (
                                                        <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>🆕 Nuevo Registro</span>
                                                    ) : (
                                                        <>Base Ant: S/ {(priceType === 'price_retail' ? item.old_retail : item.old_wholesale).toFixed(3)}</>
                                                    )}
                                                </div>
                                                <Input
                                                    type="number"
                                                    step="0.001"
                                                    value={item[priceType]}
                                                    onChange={(e) => handleUpdateItemPrice(item.sku, priceType, e.target.value)}
                                                    placeholder="0.000"
                                                    style={{
                                                        backgroundColor: '#0f172a',
                                                        textAlign: 'right',
                                                        border: item.isModified ? '2px solid #3b82f6' : '1px solid #334155',
                                                        fontSize: '1rem',
                                                        fontWeight: 'bold',
                                                        color: 'white'
                                                    }}
                                                />
                                                {isDiscounted && (
                                                    <div style={{ fontSize: '0.7rem', color: '#10b981', textAlign: 'right', marginTop: '0.25rem' }}>
                                                        Neto Sim: <strong>S/ {effectivePrice.toFixed(3)}</strong>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            {(() => {
                                                const cost = item.cost || 0;
                                                const margin = getProfitMargin(item[priceType], cost);
                                                const color = margin < 10 ? '#ef4444' : margin < 20 ? '#f59e0b' : '#10b981';
                                                return (
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                        {isRisk && <span style={{ fontSize: '0.6rem', color: '#ef4444', fontWeight: '900', animation: 'pulse 2s infinite' }}>🚨 RIESGO</span>}
                                                        {cost > 0 ? (
                                                            <>
                                                                <span style={{ color, fontWeight: 'bold', fontSize: '1rem' }}>{margin.toFixed(1)}%</span>
                                                                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Cost: S/ {cost.toFixed(2)}</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: 'bold' }}>⚠️ Sin Costo</span>
                                                                <span style={{ fontSize: '0.6rem', color: '#64748b' }}>Definir en Compras</span>
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td style={{ padding: '1rem', color: '#3b82f6', fontWeight: '500', background: 'rgba(59, 130, 246, 0.02)', textAlign: 'center' }}>
                                            S/ {calculateTermPrice(effectivePrice, policies?.credit_30_days || 0)}
                                        </td>
                                        <td style={{ padding: '1rem', color: '#3b82f6', fontWeight: '500', background: 'rgba(59, 130, 246, 0.02)', textAlign: 'center' }}>
                                            S/ {calculateTermPrice(effectivePrice, policies?.credit_60_days || 0)}
                                        </td>
                                        <td style={{ padding: '1rem', color: '#3b82f6', fontWeight: '500', background: 'rgba(59, 130, 246, 0.02)', textAlign: 'center' }}>
                                            S/ {calculateTermPrice(effectivePrice, policies?.credit_90_days || 0)}
                                        </td>
                                        <td style={{ padding: '1rem', color: '#3b82f6', fontWeight: '500', background: 'rgba(59, 130, 246, 0.02)', textAlign: 'center' }}>
                                            S/ {calculateTermPrice(effectivePrice, policies?.credit_180_days || 0)}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <button
                                                onClick={() => handleRemoveItem(item.sku)}
                                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}
                                            >
                                                ✕
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                                        Usa el buscador arriba para añadir productos a la grilla de actualización masiva.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card" style={{ marginTop: '2rem', backgroundColor: '#0f172a', border: '1px solid #334155' }}>
                <h4 style={{ color: '#94a3b8', marginBottom: '1rem' }}>🛡️ Guía de Auditoría de Precios</h4>
                <ul style={{ color: '#64748b', fontSize: '0.9rem', paddingLeft: '1.5rem' }}>
                    <li>Al guardar, se registrará una entrada en los registros de auditoría identificando al administrador.</li>
                    <li>Los precios calculados por plazos son informativos según la política configurada.</li>
                    <li>El sistema redondeará automáticamente a 3 decimales para mantener consistencia financiera.</li>
                </ul>
            </div>
        </div>
    );
};

export default PriceUpdateMasive;
