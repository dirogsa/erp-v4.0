import React, { useState, useEffect } from 'react';
import Button from './Button';
import Input from './Input';
import { formatCurrency } from '../../utils/formatters';
import { financeService, categoryService } from '../../services/api';
import { Loader2, Zap, FileText, Tag } from 'lucide-react';

const EMITTER_MAP = {
    '20606277432': { name: 'DIROGSA S.R.L.', logo: '🏢', businessName: 'DIROGSA', color: '#10b981' },
    '10434346318': { name: 'JEEF GELDER ROJAS GARCIA', logo: '👤', businessName: 'JEEF ROJAS', color: '#3b82f6' }
};

const XMLReviewModal = ({ visible, doc, onClose, onConfirm, loading }) => {
    const [exchangeRate, setExchangeRate] = useState(1);
    const [isTcMissing, setIsTcMissing] = useState(false);
    const [localItems, setLocalItems] = useState([]);
    const [emitter, setEmitter] = useState(null);
    const [isFetchingTc, setIsFetchingTc] = useState(false);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        // Cargar categorías del maestro para el dropdown dinámico
        categoryService.getCategories()
            .then(res => setCategories(res.data))
            .catch(err => console.error("Error loading categories for XML review", err));
    }, []);

    useEffect(() => {
        if (doc) {
            // Detetar emisor
            const emitterInfo = EMITTER_MAP[doc.supplier.ruc] || {
                name: doc.supplier.name,
                logo: '❓',
                businessName: 'Desconocido',
                color: '#64748b'
            };
            setEmitter(emitterInfo);

            // Inicializar items con lógica de Valor y Precio
            setLocalItems(doc.items.map(item => ({
                ...item,
                manual_value: item.unit_value, // Sin IGV
                manual_price: item.unit_price  // Con IGV
            })));

            // Buscar tipo de cambio en BD
            if (doc.currency === 'DOLARES' || doc.currency === 'USD') {
                setIsFetchingTc(true);
                financeService.getExchangeRate(doc.date)
                    .then(res => {
                        if (res.data && res.data.rate) {
                            setExchangeRate(res.data.rate);
                            setIsTcMissing(false);
                        } else {
                            setExchangeRate(3.75); // Fallback
                            setIsTcMissing(true);
                        }
                    })
                    .catch(() => {
                        setExchangeRate(3.75);
                        setIsTcMissing(true);
                    })
                    .finally(() => setIsFetchingTc(false));
            } else {
                setExchangeRate(1);
                setIsTcMissing(false);
            }
        }
    }, [doc]);

    if (!visible || !doc) return null;

    const calculateSystemTotal = () => {
        return localItems.reduce((sum, item) => sum + (item.quantity * item.manual_price * exchangeRate), 0);
    };

    const xmlTotalInSoles = doc.total_amount * exchangeRate;
    const systemTotal = calculateSystemTotal();
    const difference = systemTotal - xmlTotalInSoles;
    const isBalanced = Math.abs(difference) < 0.05;

    const handleConfirm = async (mode = 'quote') => {
        // Si el TC faltaba y el usuario lo ingresó, lo guardamos para el futuro
        if (isTcMissing && (doc.currency === 'DOLARES' || doc.currency === 'USD')) {
            try {
                await financeService.saveExchangeRate(doc.date, { rate: exchangeRate });
            } catch (err) {
                console.error("Error saving exchange rate", err);
            }
        }

        const finalData = {
            ...doc,
            currency: 'PEN',
            exchange_rate: exchangeRate,
            items: localItems.map(item => ({
                ...item,
                unit_value: Math.round((item.manual_value * exchangeRate) * 10000) / 10000,
                unit_price: Math.round((item.manual_price * exchangeRate) * 10000) / 10000,
                unit_cost: Math.round((item.manual_price * exchangeRate) * 10000) / 10000, // Legacy support
                tax_rate: 0.18,
                subtotal: Math.round((item.quantity * item.manual_price * exchangeRate) * 100) / 100
            })),
            total_amount: Math.round(systemTotal * 100) / 100,
            original_xml_id: doc.document_number,
            emitter_identity: emitter.businessName,
            payment_terms: doc.payment_terms,
            installments: doc.installments,
            import_mode: mode // 'quote' or 'direct_invoice'
        };
        onConfirm(finalData);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 2000, padding: '1.5rem'
        }}>
            <div style={{
                backgroundColor: '#0f172a',
                borderRadius: '1.5rem',
                border: '1px solid #334155',
                width: '100%', maxWidth: '1000px',
                maxHeight: '92vh', overflowY: 'auto',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 0 40px rgba(0,0,0,0.5)',
                color: '#e2e8f0',
                position: 'relative'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    backgroundColor: '#1e293b',
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTopLeftRadius: '1.5rem',
                    borderTopRightRadius: '1.5rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            fontSize: '1.25rem', padding: '0.5rem 1rem', borderRadius: '0.75rem',
                            backgroundColor: emitter?.color + '22', border: `1px solid ${emitter?.color}`,
                            color: emitter?.color, fontWeight: '800'
                        }}>
                            {emitter?.logo} {emitter?.businessName}
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'white', fontWeight: '700' }}>Revisión de XML: {doc.document_number}</h2>
                                <span style={{ fontSize: '0.7rem', backgroundColor: '#334155', color: '#60a5fa', padding: '0.2rem 0.6rem', borderRadius: '0.5rem', fontWeight: 'bold' }}>📅 {doc.date}</span>
                                <span style={{ fontSize: '0.7rem', backgroundColor: doc.payment_terms === 'Contado' ? '#064e3b' : '#450a0a', color: doc.payment_terms === 'Contado' ? '#34d399' : '#f87171', padding: '0.2rem 0.6rem', borderRadius: '0.5rem', fontWeight: 'bold', border: '1px solid currentColor' }}>💳 {doc.payment_terms}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                                {doc.supplier.name} - RUC: {doc.supplier.ruc} 
                                {doc.supplier.ubigeo && <span style={{ marginLeft: '10px', color: '#64748b' }}>(📍 {doc.supplier.ubigeo})</span>}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: '#94a3b8' }}>×</button>
                </div>

                <div style={{ padding: '2rem' }}>
                    {/* Currency & T.C. Controls */}
                    <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem',
                        padding: '1.5rem', backgroundColor: '#1e293b', borderRadius: '1.25rem', border: '1px solid #334155',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Moneda Original</label>
                            <div style={{ padding: '0.75rem', backgroundColor: '#0f172a', borderRadius: '0.75rem', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>{doc.currency === 'DOLARES' || doc.currency === 'USD' ? '💵' : '🇵🇪'}</span>
                                <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>{doc.currency}</span>
                            </div>
                        </div>

                        {(doc.currency === 'DOLARES' || doc.currency === 'USD') && (
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <label style={{ 
                                    display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', 
                                    color: isTcMissing ? '#fbbf24' : '#10b981', 
                                    marginBottom: '0.5rem', fontWeight: 'bold', textTransform: 'uppercase' 
                                }}>
                                    <span>Tipo de Cambio (T.C.)</span>
                                    {isFetchingTc ? <Loader2 className="animate-spin" size={12} /> : 
                                     isTcMissing ? <span>⚠️ REQUERIDO</span> : <span>✅ VERIFICADO</span>}
                                </label>
                                <Input
                                    type="number"
                                    step="0.001"
                                    value={exchangeRate}
                                    onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
                                    placeholder="Ej: 3.75"
                                    style={{ 
                                        margin: 0, 
                                        border: isTcMissing ? '2px solid #fbbf24' : '2px solid #10b981',
                                        fontSize: '1.1rem',
                                        fontWeight: '800',
                                        color: isTcMissing ? '#fbbf24' : '#10b981'
                                    }}
                                />
                                {isTcMissing && <p style={{ fontSize: '0.65rem', color: '#fbbf24', marginTop: '0.4rem' }}>No se encontró T.C. para esta fecha. Se guardará el valor ingresado.</p>}
                            </div>
                        )}

                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Original XML</label>
                            <div style={{ padding: '0.75rem', color: 'white', fontWeight: '900', fontSize: '1.4rem' }}>
                                {doc.currency === 'DOLARES' || doc.currency === 'USD' ? `$ ` : `S/ `} {doc.total_amount.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div style={{ border: '1px solid #334155', borderRadius: '1rem', overflow: 'hidden', backgroundColor: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead style={{ backgroundColor: '#1e293b', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '1.25rem' }}>PRODUCTO / SKU</th>
                                    <th style={{ textAlign: 'center', padding: '1.25rem' }}>CATEGORÍA</th>
                                    <th style={{ textAlign: 'center', padding: '1.25rem' }}>CANT.</th>
                                    <th style={{ textAlign: 'right', padding: '1.25rem' }}>BASE (VALOR S/ IGV)</th>
                                    <th style={{ textAlign: 'right', padding: '1.25rem' }}>PRECIO (+IGV)</th>
                                    <th style={{ textAlign: 'right', padding: '1.25rem' }}>TOTAL ITEM</th>
                                </tr>
                            </thead>
                            <tbody>
                                {localItems.map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #1e293b', transition: 'background-color 0.2s', backgroundColor: item.is_misc ? '#1e293b44' : 'transparent' }}>
                                        <td style={{ padding: '1rem 1.25rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <input
                                                    type="text"
                                                    value={item.product_sku}
                                                    onChange={(e) => {
                                                        const val = e.target.value.toUpperCase();
                                                        const newItems = [...localItems];
                                                        newItems[idx].product_sku = val;
                                                        setLocalItems(newItems);
                                                    }}
                                                    title="Haga clic para corregir el SKU si es necesario"
                                                    style={{
                                                        background: '#0f172a', border: '1px solid #1e293b',
                                                        color: item.is_misc ? '#94a3b8' : '#10b981', padding: '0.3rem 0.5rem', borderRadius: '0.4rem',
                                                        fontWeight: '900', fontSize: '0.85rem', width: '130px',
                                                        outline: 'none'
                                                    }}
                                                />
                                                {item.is_misc && <span style={{ fontSize: '0.65rem', backgroundColor: '#334155', color: '#94a3b8', padding: '2px 6px', borderRadius: '4px' }}>GENÉRICO</span>}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px', marginTop: '4px' }}>{item.product_name}</div>
                                        </td>
                                        <td style={{ textAlign: 'center', padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                                                    <select
                                                        value={item.classification || 'FILTER'}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            const newItems = [...localItems];
                                                            newItems[idx].classification = val;
                                                            newItems[idx].is_misc = val !== 'FILTER';
                                                            setLocalItems(newItems);
                                                        }}
                                                        style={{
                                                            background: '#1e293b', border: '1px solid #334155', color: 'white',
                                                            fontSize: '0.75rem', padding: '0.4rem', borderRadius: '0.5rem', outline: 'none',
                                                            minWidth: '140px'
                                                        }}
                                                    >
                                                        {/* Opción por defecto siempre presente */}
                                                        <option value="FILTER">📑 Filtro</option>
                                                        
                                                        {/* Categorías dinámicas del Maestro */}
                                                        {categories.map(cat => {
                                                            const emojiMap = {
                                                                'Package': '📦', 'Droplet': '🛢️', 'Zap': '⚡', 
                                                                'Filter': '📑', 'Battery': '🔋', 'Truck': '🚚', 'Layers': '🗂️'
                                                            };
                                                            const emoji = emojiMap[cat.icon] || '🏷️';
                                                            return (
                                                                <option key={cat._id} value={cat.name.toUpperCase().replace(/\s+/g, '_')}>
                                                                    {emoji} {cat.name}
                                                                </option>
                                                            );
                                                        })}

                                                        {/* Fallback si no hay categorías */}
                                                        {categories.length === 0 && (
                                                            <>
                                                                <option value="LUBRICANT">🛢️ Aceite</option>
                                                                <option value="SPARK_PLUG">🛠️ Bujía</option>
                                                                <option value="BATTERY">🔋 Batería</option>
                                                            </>
                                                        )}
                                                        <option value="MISC">📦 Otros</option>
                                                    </select>

                                                {item.classification && item.classification !== 'FILTER' && (
                                                    <button
                                                        onClick={() => {
                                                            const newItems = [...localItems];
                                                            const map = {
                                                                'LUBRICANT': 'VARIOS-ACEITES',
                                                                'SPARK_PLUG': 'VARIOS-BUJIAS',
                                                                'BATTERY': 'VARIOS-BATERIAS',
                                                                'COOLANT': 'VARIOS-REFRIGERANTES',
                                                                'MISC': 'VARIOS-GENERICO'
                                                            };
                                                            newItems[idx].product_sku = map[item.classification] || 'VARIOS-GENERICO';
                                                            setLocalItems(newItems);
                                                        }}
                                                        title="Mapear a SKU Genérico"
                                                        style={{
                                                            background: '#334155', border: 'none', color: '#60a5fa', 
                                                            padding: '4px', borderRadius: '4px', cursor: 'pointer', display: 'flex'
                                                        }}
                                                    >
                                                        <Zap size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center', padding: '1rem', color: '#cbd5e1', fontWeight: '700' }}>{item.quantity}</td>
                                        <td style={{ textAlign: 'right', padding: '1rem' }}>
                                            <input
                                                type="number"
                                                step="0.0001"
                                                value={item.manual_value}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    const newItems = [...localItems];
                                                    newItems[idx].manual_value = val;
                                                    newItems[idx].manual_price = Math.round((val * 1.18) * 10000) / 10000;
                                                    setLocalItems(newItems);
                                                }}
                                                style={{
                                                    width: '90px', background: '#0f172a', border: '1px solid #1e293b',
                                                    color: '#94a3b8', padding: '0.5rem', borderRadius: '0.5rem', textAlign: 'right', fontWeight: '600', fontSize: '0.85rem'
                                                }}
                                            />
                                        </td>
                                        <td style={{ textAlign: 'right', padding: '1rem' }}>
                                            <input
                                                type="number"
                                                step="0.0001"
                                                value={item.manual_price}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    const newItems = [...localItems];
                                                    newItems[idx].manual_price = val;
                                                    newItems[idx].manual_value = Math.round((val / 1.18) * 10000) / 10000;
                                                    setLocalItems(newItems);
                                                }}
                                                style={{
                                                    width: '90px', background: '#1e293b', border: '1px solid #334155',
                                                    color: '#fbbf24', padding: '0.5rem', borderRadius: '0.5rem', textAlign: 'right', fontWeight: '900', fontSize: '0.95rem'
                                                }}
                                            />
                                        </td>
                                        <td style={{ textAlign: 'right', padding: '1rem', color: 'white', fontWeight: '800' }}>
                                            {formatCurrency(item.quantity * item.manual_price * exchangeRate)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Reconciliation Footer */}
                    <div style={{
                        marginTop: '2.5rem', padding: '2rem', borderRadius: '1.25rem',
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                        border: `2px solid ${isBalanced ? '#10b98144' : '#ef444444'}`,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ display: 'flex', gap: '3rem' }}>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '700', letterSpacing: '0.05em' }}>Original XML (PEN)</div>
                                <div style={{ fontSize: '1.6rem', fontWeight: '900', color: 'white' }}>{formatCurrency(xmlTotalInSoles)}</div>
                            </div>
                            <div style={{ width: '2px', backgroundColor: '#334155', alignSelf: 'stretch' }}></div>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '700', letterSpacing: '0.05em' }}>Calculado Sistema</div>
                                <div style={{ fontSize: '1.6rem', fontWeight: '900', color: isBalanced ? '#10b981' : '#f87171' }}>{formatCurrency(systemTotal)}</div>
                            </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                                padding: '0.6rem 1.25rem', borderRadius: '2rem', fontSize: '0.9rem', fontWeight: '800',
                                backgroundColor: isBalanced ? '#064e3b' : '#450a0a',
                                color: isBalanced ? '#34d399' : '#f87171',
                                border: `1px solid ${isBalanced ? '#10b98188' : '#ef444488'}`
                            }}>
                                {isBalanced ? '✅ Cuadre Perfecto' : `⚠️ Diferencia: S/ ${difference.toFixed(2)}`}
                            </div>
                            {!isBalanced && (
                                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.75rem' }}>Ajusta los precios unitarios (+IGV) para cuadrar con el XML.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions Footer */}
                <div style={{
                    padding: '1.5rem 2rem', borderTop: '1px solid #334155', backgroundColor: '#1e293b',
                    borderBottomLeftRadius: '1.5rem', borderBottomRightRadius: '1.5rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <Button variant="secondary" onClick={onClose} style={{ border: 'none', color: '#94a3b8' }}>Cancelar</Button>
                    
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Button
                            variant="primary"
                            onClick={() => handleConfirm()}
                            disabled={!isBalanced || loading}
                            style={{
                                backgroundColor: isBalanced ? '#10b981' : '#64748b',
                                boxShadow: isBalanced ? '0 4px 15px rgba(16, 185, 129, 0.4)' : 'none',
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                fontWeight: '900',
                                padding: '0.75rem 2.5rem'
                            }}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Zap size={18} />}
                            {loading ? 'Guardando...' : 'GUARDAR CAMBIOS Y CERRAR'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default XMLReviewModal;
