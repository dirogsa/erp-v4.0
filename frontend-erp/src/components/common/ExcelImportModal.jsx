import React, { useState, useEffect } from 'react';
import Button from './Button';
import { parseExcelText, autoDetectMapping } from './hooks/useExcelParser';

const ExcelImportModal = ({
    visible,
    onClose,
    onImport,
    title = 'Importar desde Excel',
    columns = [],
    onValidate, // async (rawRows, mapping) => { valid, ambiguous, errors }
    onResolveAmbiguous, // async (item, selectedBrand) => { valid: true/false, item: {...} }
    renderValidRow, // (item, index) => <tr key={index}>...</tr>
    validTableHeaders = [] // ['SKU', 'Producto', 'Cant.', 'Total']
}) => {
    const [pastedData, setPastedData] = useState('');
    const [parsedItems, setParsedItems] = useState([]);
    const [mapping, setMapping] = useState({});
    const [step, setStep] = useState(1); // 1: Paste, 2: Map & Validate, 3: Final Review
    
    const [validationStatus, setValidationStatus] = useState({ loading: false, errors: [] });
    const [validatedItems, setValidatedItems] = useState([]);
    const [ambiguousItems, setAmbiguousItems] = useState([]);

    useEffect(() => {
        if (visible && step === 1) {
            setPastedData('');
            setParsedItems([]);
            setMapping({});
            setValidatedItems([]);
            setAmbiguousItems([]);
            setValidationStatus({ loading: false, errors: [] });
        }
    }, [visible, step]);

    if (!visible) return null;

    const handlePaste = (e) => {
        const text = e.target.value;
        setPastedData(text);
        const rows = parseExcelText(text);
        setParsedItems(rows);
        setMapping(autoDetectMapping(rows, columns));
    };

    const nextStep = async () => {
        if (step === 1) {
            if (!pastedData.trim()) return;
            setStep(2);
        } else if (step === 2) {
            await executeValidation();
        }
    };

    const executeValidation = async () => {
        setValidationStatus({ loading: true, errors: [] });
        try {
            const { valid, ambiguous = [], errors = [] } = await onValidate(parsedItems, mapping);
            setValidatedItems(valid);
            setAmbiguousItems(ambiguous);
            setValidationStatus({ loading: false, errors });
            setStep(3);
        } catch (err) {
            console.error(err);
            setValidationStatus({ loading: false, errors: ['Error crítico en la validación.'] });
        }
    };

    const handleResolve = async (item, selectedBrand) => {
        if (!onResolveAmbiguous) return;
        setValidationStatus(prev => ({ ...prev, loading: true }));
        try {
            const res = await onResolveAmbiguous(item, selectedBrand);
            if (res && res.valid) {
                setValidatedItems(prev => [...prev, res.item]);
                setAmbiguousItems(prev => prev.filter(u => u.sku !== item.sku));
            } else {
                setValidationStatus(prev => ({ ...prev, errors: [...prev.errors, `Error al resolver ambigüedad para ${item.sku}`] }));
            }
        } catch (err) {
            setValidationStatus(prev => ({ ...prev, errors: [...prev.errors, `Error conectando con servidor para ${item.sku}`] }));
        } finally {
            setValidationStatus(prev => ({ ...prev, loading: false }));
        }
    };

    const confirmImport = () => {
        onImport(validatedItems);
        onClose();
        setStep(1);
    };

    const Spinner = () => (
        <div style={{
            width: '24px', height: '24px',
            border: '3px solid rgba(59, 130, 246, 0.2)',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
        }} />
    );

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 2000, padding: '2rem', backdropFilter: 'blur(4px)'
        }}>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <div style={{
                backgroundColor: '#0f172a', borderRadius: '0.75rem', width: '100%', maxWidth: '800px',
                display: 'flex', flexDirection: 'column', maxHeight: '90vh', border: '1px solid #334155',
                position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                {validationStatus.loading && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)',
                        zIndex: 2100, display: 'flex', flexDirection: 'column',
                        justifyContent: 'center', alignItems: 'center', borderRadius: '0.75rem', gap: '1rem'
                    }}>
                        <Spinner />
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ color: 'white', fontWeight: 'bold', margin: 0 }}>Procesando...</p>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '32px', height: '32px', backgroundColor: '#1e293b', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#3b82f6', fontWeight: 'bold' }}>
                            {step}
                        </div>
                        <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem' }}>{title}</h2>
                    </div>
                    <button onClick={onClose} disabled={validationStatus.loading} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                    {step === 1 && (
                        <div>
                            <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                                Copia el rango de celdas en tu Excel y presiona Ctrl+V aquí.
                            </p>
                            <textarea
                                value={pastedData} onChange={handlePaste}
                                placeholder="Pega aquí..."
                                style={{ width: '100%', height: '300px', backgroundColor: '#1e293b', color: 'white', border: '2px dashed #334155', borderRadius: '0.75rem', padding: '1rem', fontFamily: 'monospace', fontSize: '0.9rem', outline: 'none', resize: 'none' }}
                            />
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <p style={{ color: '#94a3b8', margin: 0 }}>Define qué contiene cada columna:</p>
                                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Previa de 5 filas</span>
                            </div>
                            <div style={{ border: '1px solid #334155', borderRadius: '0.5rem', overflow: 'hidden' }}>
                                <table style={{ width: '100%', color: 'white', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#1e293b', textAlign: 'left' }}>
                                            {parsedItems[0]?.map((_, i) => (
                                                <th key={i} style={{ padding: '0.75rem' }}>
                                                    <select
                                                        value={Object.keys(mapping).find(k => mapping[k] === i) || 'none'}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            const newMapping = { ...mapping };
                                                            Object.keys(newMapping).forEach(k => { if (newMapping[k] === i) delete newMapping[k]; });
                                                            if (val !== 'none') newMapping[val] = i;
                                                            setMapping(newMapping);
                                                        }}
                                                        style={{ backgroundColor: '#0f172a', color: 'white', border: '1px solid #475569', padding: '0.4rem', borderRadius: '6px', width: '100%', cursor: 'pointer' }}
                                                    >
                                                        <option value="none">Ignorar</option>
                                                        {columns.map(col => (
                                                            <option key={col.key} value={col.key}>{col.label}</option>
                                                        ))}
                                                    </select>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsedItems.slice(0, 5).map((row, idx) => (
                                            <tr key={idx} style={{ borderTop: '1px solid #334155' }}>
                                                {row.map((cell, i) => (
                                                    <td key={i} style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#94a3b8' }}>{cell}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h4 style={{ color: 'white', margin: 0, fontSize: '1.1rem' }}>Resumen Final</h4>
                                <div style={{ padding: '0.4rem 0.8rem', backgroundColor: validationStatus.errors.length > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', borderRadius: '2rem', border: `1px solid ${validationStatus.errors.length > 0 ? '#ef4444' : '#10b981'}`, fontSize: '0.75rem', color: validationStatus.errors.length > 0 ? '#f87171' : '#34d399' }}>
                                    {validationStatus.errors.length > 0 ? `${validationStatus.errors.length} errores` : 'Todo válido'}
                                </div>
                            </div>

                            {ambiguousItems.length > 0 && onResolveAmbiguous && (
                                <div style={{ marginBottom: '1.5rem', border: '1px solid #ef4444', borderRadius: '0.75rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.05)' }}>
                                    <h4 style={{ color: '#ef4444', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>⚠️ Atención Requerida: SKUs Ambiguos ({ambiguousItems.length})</h4>
                                    <p style={{ color: '#fca5a5', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>Selecciona la marca correcta para incluirlos en la importación.</p>
                                    <div style={{ display: 'grid', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                                        {ambiguousItems.map((item, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                                                <div>
                                                    <div style={{ color: 'white', fontWeight: 'bold' }}>{item.sku}</div>
                                                    <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Costo: S/ {item.proposed_cost || '---'} | Precio: S/ {item.proposed_price || '---'}</div>
                                                </div>
                                                <div>
                                                    {item.available_brands ? (
                                                        <select
                                                            onChange={(e) => { if (e.target.value) handleResolve(item, e.target.value); }}
                                                            defaultValue=""
                                                            style={{ background: '#0f172a', border: '1px solid #ef4444', color: 'white', padding: '0.4rem', borderRadius: '0.4rem', outline: 'none', cursor: 'pointer' }}
                                                        >
                                                            <option value="" disabled>Elegir marca...</option>
                                                            {item.available_brands.map(b => <option key={b} value={b}>{b}</option>)}
                                                        </select>
                                                    ) : (
                                                        <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{item.reason}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ backgroundColor: '#1e293b', padding: '1.25rem', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ fontSize: '1.5rem' }}>📦</span>
                                    <div>
                                        <p style={{ color: 'white', fontWeight: 'bold', margin: 0 }}>{validatedItems.length} productos procesados</p>
                                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>Listos para añadir.</p>
                                    </div>
                                </div>
                                {validationStatus.errors.length > 0 && (
                                    <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #334155' }}>
                                        <p style={{ color: '#fca5a5', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 'bold' }}>⚠️ Algunos productos fueron omitidos:</p>
                                        <div style={{ maxHeight: '120px', overflowY: 'auto', fontSize: '0.8rem', color: '#fca5a5' }}>
                                            {validationStatus.errors.map((err, i) => <div key={i} style={{ marginBottom: '0.25rem' }}>• {err}</div>)}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ border: '1px solid #334155', borderRadius: '0.5rem', overflow: 'hidden' }}>
                                <table style={{ width: '100%', color: 'white', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', backgroundColor: '#1e293b', color: '#64748b' }}>
                                            {validTableHeaders.map((h, i) => <th key={i} style={{ padding: '0.75rem' }}>{h}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {validatedItems.map((item, i) => renderValidRow(item, i))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '1.5rem', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <Button variant="secondary" onClick={() => step > 1 ? setStep(step - 1) : onClose()} disabled={validationStatus.loading}>
                        {step === 1 ? 'Cancelar' : 'Atrás'}
                    </Button>
                    {step < 3 ? (
                        <Button onClick={nextStep} disabled={!pastedData || (step === 1 && !pastedData.trim()) || validationStatus.loading}>
                            {validationStatus.loading ? 'Procesando...' : 'Continuar'}
                        </Button>
                    ) : (
                        <Button variant="primary" onClick={confirmImport} disabled={validatedItems.length === 0 || validationStatus.loading}>
                            Confirmar e Importar
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExcelImportModal;
