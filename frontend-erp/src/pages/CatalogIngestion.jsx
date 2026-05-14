import React, { useState, useCallback, useEffect } from 'react';
import Layout from '../components/Layout';
import { inventoryService, categoryService } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import { useLoading } from '../context/LoadingContext';
import { parseCatalogHtml } from '../utils/catalogParsers';
import Button from '../components/common/Button';
import { 
    Upload, Search, CheckCircle, Trash2, Database, 
    Rocket, Edit3, X, ChevronUp, Info, Globe, AlertCircle,
    ShieldCheck, Zap
} from 'lucide-react';
import Input from '../components/common/Input';

const CatalogIngestion = () => {
    const { showNotification } = useNotification();
    const { showLoading, hideLoading } = useLoading();
    const [dbCategories, setDbCategories] = useState([]);
    const [parsedProducts, setParsedProducts] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [showSkuMode, setShowSkuMode] = useState(false);
    const [skuList, setSkuList] = useState('');
    const [uploadStatus, setUploadStatus] = useState({ total: 0, current: 0, errors: [] });
    const [editingProduct, setEditingProduct] = useState(null);
    const [editingIndex, setEditingIndex] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [processSummary, setProcessSummary] = useState({ created: 0, updated: 0, skipped: 0, total: 0 });
    const [ingestionStrategy, setIngestionStrategy] = useState('OVERWRITE'); // 'OVERWRITE' or 'CONSERVATIVE'

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await categoryService.getCategories();
                if (res?.data) setDbCategories(res.data);
            } catch (err) { console.error("Error loading categories:", err); }
        };
        fetchCategories();
    }, []);

    const reconcileCategory = (catName) => {
        if (!catName) return { name: 'Desconocido', official: false };
        const norm = catName.trim().toUpperCase();
        const match = dbCategories.find(c => 
            c.name.toUpperCase() === norm || 
            (c.import_aliases && c.import_aliases.some(a => a.toUpperCase() === norm))
        );
        if (match) return { name: match.name, official: true, id: match._id };
        return { name: catName, official: false };
    };

    const handleFileDrop = (e) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer?.files || e.target.files);
        const htmlFiles = droppedFiles.filter(f => f.name.endsWith('.html'));
        if (htmlFiles.length === 0) {
            showNotification('Seleccione archivos .html válidos', 'error');
            return;
        }
        processFiles(htmlFiles);
    };

    const handleSkuLookup = async () => {
        const rawSkus = skuList.split('\n').map(s => s.trim()).filter(s => s !== '');
        if (rawSkus.length === 0) return;
        setIsSearching(true);
        setUploadStatus({ total: rawSkus.length, current: 0, errors: [] });

        const batchSize = 3;
        for (let i = 0; i < rawSkus.length; i += batchSize) {
            const batch = rawSkus.slice(i, i + batchSize);
            const results = await Promise.all(batch.map(async (sku) => {
                try {
                    const response = await inventoryService.externalLookup(sku);
                    const html = response.data.html;
                    if (html) {
                        const data = parseCatalogHtml(html, '', dbCategories);
                        if (data?.sku) {
                            const reconciled = reconcileCategory(data.category_name);
                            return { 
                                success: true, 
                                data: { ...data, category_name: reconciled.name, _reconciled: reconciled.official, _file: `Auto-Lookup: ${sku}`, _status: 'pending' } 
                            };
                        }
                    }
                    return { success: false, error: `${sku}: No encontrado` };
                } catch (err) { return { success: false, error: `${sku}: Error de red` }; }
            }));
            const foundInBatch = results.filter(r => r.success).map(r => r.data);
            if (foundInBatch.length > 0) {
                setParsedProducts(prev => {
                    const filtered = foundInBatch.filter(newItem => !prev.some(existing => existing.sku === newItem.sku && existing.brand === newItem.brand));
                    return [...prev, ...filtered];
                });
            }
            setUploadStatus(prev => ({ ...prev, current: prev.current + batch.length }));
        }
        setIsSearching(false);
        setSkuList('');
        showNotification(`Búsqueda inteligente finalizada`, 'info');
    };

    const processFiles = async (fileList) => {
        setIsParsing(true);
        setUploadStatus({ total: fileList.length, current: 0, errors: [] });
        const newProducts = [];
        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            try {
                const text = await file.text();
                const data = parseCatalogHtml(text, file.name, dbCategories);
                if (data?.sku) {
                    const reconciled = reconcileCategory(data.category_name);
                    newProducts.push({ ...data, category_name: reconciled.name, _reconciled: reconciled.official, _file: file.name, _status: 'pending' });
                }
            } catch (err) { console.error(err); }
            setUploadStatus(prev => ({ ...prev, current: i + 1 }));
        }
        if (newProducts.length > 0) {
            const filtered = newProducts.filter(newItem => !parsedProducts.some(existing => existing.sku === newItem.sku && existing.brand === newItem.brand));
            setParsedProducts(prev => [...prev, ...filtered]);
            showNotification(`${filtered.length} productos listos`, 'success');
        }
        setIsParsing(false);
    };

    const handleBulkUpload = async () => {
        if (parsedProducts.length === 0) return;
        setIsProcessing(true);
        showLoading("Sincronizando Catálogo Maestro...", "Integrando miles de datos técnicos en la base de datos central.");
        try {
            const productsToUpload = parsedProducts.map(({ _file, _status, _reconciled, ...rest }) => rest);
            const response = await inventoryService.bulkCreateProducts(productsToUpload, ingestionStrategy === 'OVERWRITE');
            setProcessSummary(response.data);
            setShowSuccessModal(true);
            setParsedProducts([]);
        } catch (error) { showNotification(`Error en carga: ${error.message}`, 'error'); }
        finally { 
            setIsProcessing(false); 
            hideLoading();
        }
    };

    return (
        <Layout>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                    <div>
                        <h1 style={{ color: 'white', margin: 0, fontSize: '2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Rocket size={36} color="#eab308" />
                            Smart Discovery Hub
                        </h1>
                        <p style={{ color: '#94a3b8', marginTop: '0.5rem', fontSize: '1.1rem' }}>
                            Alimentación automatizada de catálogo maestro desde fuentes oficiales.
                        </p>
                    </div>
                    {parsedProducts.length > 0 && (
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ display: 'flex', background: '#0f172a', padding: '0.4rem', borderRadius: '0.75rem', border: '1px solid #334155' }}>
                                <Button 
                                    variant={ingestionStrategy === 'OVERWRITE' ? 'primary' : 'ghost'}
                                    size="small"
                                    icon={Zap}
                                    onClick={() => setIngestionStrategy('OVERWRITE')}
                                    title="Modo Espejo: Sobrescribe productos existentes con los datos del catálogo."
                                >
                                    Espejo
                                </Button>
                                <Button 
                                    variant={ingestionStrategy === 'CONSERVATIVE' ? 'success' : 'ghost'}
                                    size="small"
                                    icon={ShieldCheck}
                                    onClick={() => setIngestionStrategy('CONSERVATIVE')}
                                    title="Modo Conservador: Protege productos existentes. Solo agrega ítems nuevos."
                                >
                                    Conservador
                                </Button>
                            </div>
                            <Button 
                                variant="warning" 
                                icon={Database}
                                onClick={handleBulkUpload} 
                                loading={isProcessing}
                            >
                                Procesar {parsedProducts.length} Ítems
                            </Button>
                        </div>
                    )}
                </div>

                <div style={{ background: '#1e293b', borderRadius: '1.5rem', border: '1px solid #334155', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(234, 179, 8, 0.05) 0%, transparent 70%)', zIndex: 0 }} />

                    <div 
                        style={{ border: '2px dashed #475569', borderRadius: '1rem', padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s ease', background: 'rgba(15, 23, 42, 0.4)', marginBottom: '1rem' }}
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#eab308'; e.currentTarget.style.background = 'rgba(234, 179, 8, 0.05)'; }}
                        onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#475569'; e.currentTarget.style.background = 'rgba(15, 23, 42, 0.4)'; }}
                        onDrop={(e) => { e.preventDefault(); handleFileDrop(e); }}
                        onClick={() => document.getElementById('file-input').click()}
                    >
                        <input type="file" id="file-input" multiple accept=".html" style={{ display: 'none' }} onChange={handleFileDrop} />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '64px', height: '64px', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                                <Upload size={32} color="#eab308" />
                            </div>
                            <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem' }}>Suelte páginas HTML de catálogos aquí</h2>
                            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Compatible con WIX, Filtron, Azumi y Asakashi.</p>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                        <button onClick={() => setShowSkuMode(!showSkuMode)} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                            {showSkuMode ? <ChevronUp size={16} /> : <Globe size={16} />}
                            {showSkuMode ? 'Ocultar Ingesta por Códigos' : '¿No tienes archivos? Buscar por SKUs directamente'}
                        </button>
                    </div>

                    {showSkuMode && (
                        <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '1rem', border: '1px solid #334155' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <textarea
                                        placeholder="Pega tus códigos aquí (uno por línea)..."
                                        value={skuList}
                                        onChange={(e) => setSkuList(e.target.value)}
                                        style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '0.75rem', color: 'white', padding: '1rem', minHeight: '100px', fontSize: '0.9rem', resize: 'vertical' }}
                                    />
                                </div>
                                <div style={{ minWidth: '180px' }}>
                                    <Button variant="primary" onClick={handleSkuLookup} loading={isSearching} disabled={!skuList.trim()} style={{ width: '100%' }}>
                                        <Search size={18} style={{ marginRight: '0.5rem' }} /> Descubrir Datos
                                    </Button>
                                    <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#0f172a', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.75rem' }}>
                                            <Info size={14} /> <span>El sistema buscará en fuentes globales automáticamente.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {parsedProducts.length > 0 && (
                    <div style={{ background: '#1e293b', borderRadius: '1rem', border: '1px solid #334155', marginTop: '2rem', overflow: 'hidden' }}>
                        <div style={{ padding: '1.25rem', background: '#0f172a', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ color: 'white', margin: 0, fontSize: '1rem' }}>Productos Identificados ({parsedProducts.length})</h3>
                            <button onClick={() => setParsedProducts([])} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}>Limpiar lista</button>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e2e8f0' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #334155', background: 'rgba(15, 23, 42, 0.4)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#94a3b8' }}>SKU</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#94a3b8' }}>Identidad</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#94a3b8' }}>Categoría</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>Atributos</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem', color: '#94a3b8' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parsedProducts.map((p, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #33415577', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: '800', color: '#eab308' }}>{p.sku}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{p.brand}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.9rem', color: 'white', fontWeight: '500' }}>{p.name}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ 
                                                background: p._reconciled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                color: p._reconciled ? '#10b981' : '#f87171',
                                                padding: '0.3rem 0.75rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: '600',
                                                display: 'inline-flex', alignItems: 'center', gap: '0.4rem', border: `1px solid ${p._reconciled ? '#10b98133' : '#f8717133'}`
                                            }}>
                                                {p.category_name || 'Desconocido'}
                                                {p._reconciled ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                                <div title="Medidas" style={{ background: '#334155', width: '24px', height: '24px', borderRadius: '4px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p.specs?.length || 0}</div>
                                                <div title="Equivalencias" style={{ background: p.equivalences?.length > 0 ? '#1e3a8a' : '#334155', color: p.equivalences?.length > 0 ? '#60a5fa' : 'white', width: '24px', height: '24px', borderRadius: '4px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p.equivalences?.length || 0}</div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button onClick={() => { setEditingIndex(idx); setEditingProduct({...p}); }} style={{ background: '#334155', border: 'none', color: 'white', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer' }}><Edit3 size={16} /></button>
                                                <button onClick={() => setParsedProducts(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {editingProduct && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: '#1e293b', width: '100%', maxWidth: '700px', borderRadius: '1.5rem', border: '1px solid #334155', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem' }}>Refinar Datos Extraídos</h2>
                            <button onClick={() => setEditingProduct(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <div style={{ padding: '2rem', overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: '220px 1fr', gap: '2rem' }}>
                            <div style={{ background: '#0f172a', borderRadius: '1rem', border: '1px solid #334155', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                                <img src={editingProduct.image_url} alt="Product" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onError={(e) => { e.target.src = 'https://placehold.co/200x200?text=No+Image'; }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <Input label="Nombre del Producto" value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <Input label="SKU" value={editingProduct.sku} disabled />
                                    <Input label="Marca" value={editingProduct.brand} disabled />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Categoría (Reconciliación Inteligente)</label>
                                    <select 
                                        style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', color: 'white', padding: '0.75rem' }}
                                        value={editingProduct.category_name}
                                        onChange={(e) => {
                                            const reconciled = reconcileCategory(e.target.value);
                                            setEditingProduct({ ...editingProduct, category_name: reconciled.name, _reconciled: reconciled.official });
                                        }}
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {dbCategories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: '1.5rem', borderTop: '1px solid #334155', textAlign: 'right' }}>
                            <Button variant="primary" onClick={() => { 
                                const list = [...parsedProducts];
                                list[editingIndex] = editingProduct;
                                setParsedProducts(list);
                                setEditingProduct(null);
                            }}>Confirmar Cambios</Button>
                        </div>
                    </div>
                </div>
            )}

            {showSuccessModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
                    <div style={{ background: '#1e293b', padding: '3rem', borderRadius: '2rem', textAlign: 'center', maxWidth: '500px', border: '1px solid #eab308' }}>
                        <div style={{ width: '80px', height: '80px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <CheckCircle size={48} color="#10b981" />
                        </div>
                        <h2 style={{ color: 'white', marginBottom: '1rem' }}>¡Ingesta Completada!</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '1rem' }}>
                                <div style={{ fontSize: '1.5rem', color: '#10b981', fontWeight: 'bold' }}>{processSummary.created}</div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Creados</div>
                            </div>
                            <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '1rem' }}>
                                <div style={{ fontSize: '1.5rem', color: '#3b82f6', fontWeight: 'bold' }}>{processSummary.updated}</div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Actualizados</div>
                            </div>
                        </div>
                        <Button variant="primary" onClick={() => setShowSuccessModal(false)} style={{ width: '100%' }}>Continuar</Button>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default CatalogIngestion;
