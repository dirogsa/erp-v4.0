import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { inventoryService, categoryService } from '../services/api';
import { parseCatalogHtml } from '../utils/catalogParsers';
import IndustrialIngestor from '../components/common/IndustrialIngestor';
import Button from '../components/common/Button';
import { useNotification } from '../hooks/useNotification';
import { 
    Rocket, Search, Globe, ChevronUp, 
    Zap, ShieldCheck, CheckCircle
} from 'lucide-react';

const CatalogIngestion = () => {
    const { showNotification } = useNotification();
    const [dbCategories, setDbCategories] = useState([]);
    const [showSkuMode, setShowSkuMode] = useState(false);
    const [skuList, setSkuList] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [processSummary, setProcessSummary] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const ingestorRef = useRef();

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

    const handleFileDetected = async (files) => {
        const newItems = [];
        for (const file of files) {
            try {
                const text = await file.text();
                const data = parseCatalogHtml(text, file.name, dbCategories);
                if (data?.sku) {
                    const reconciled = reconcileCategory(data.category_name);
                    newItems.push({ ...data, category_name: reconciled.name, _reconciled: reconciled.official, id: data.sku });
                }
            } catch (err) {
                console.error(`Error parsing ${file.name}:`, err);
            }
        }
        if (newItems.length > 0) {
            ingestorRef.current.addItems(newItems);
            showNotification(`${newItems.length} ítems cargados desde archivos.`, 'success');
        }
    };

    const handleSkuLookup = async () => {
        const skus = skuList.split('\n').map(s => s.trim()).filter(s => s !== '');
        if (skus.length === 0) return;
        setIsSearching(true);
        
        const foundItems = [];
        for (const sku of skus) {
            try {
                const response = await inventoryService.externalLookup(sku);
                if (response.data.html) {
                    const data = parseCatalogHtml(response.data.html, '', dbCategories);
                    if (data?.sku) {
                        const reconciled = reconcileCategory(data.category_name);
                        foundItems.push({ ...data, category_name: reconciled.name, _reconciled: reconciled.official, id: data.sku });
                    }
                }
            } catch (err) {}
        }
        
        if (foundItems.length > 0) {
            ingestorRef.current.addItems(foundItems);
            showNotification(`${foundItems.length} productos descubiertos exitosamente.`, 'success');
            setSkuList('');
        } else {
            showNotification('No se encontraron datos para los SKUs proporcionados.', 'warning');
        }
        setIsSearching(false);
    };

    const handleParse = (text) => {
        const data = parseCatalogHtml(text, 'Manual Paste', dbCategories);
        if (data?.sku) {
            const reconciled = reconcileCategory(data.category_name);
            return [{ ...data, category_name: reconciled.name, _reconciled: reconciled.official, id: data.sku }];
        }
        return [];
    };

    const handlePersist = async (items, strategy) => {
        const payload = items.map(({ id, _reconciled, ...rest }) => rest);
        const response = await inventoryService.bulkCreateProducts(payload, strategy === 'OVERWRITE');
        setProcessSummary(response.data);
        setShowSuccessModal(true);
    };

    const columns = [
        { 
            label: 'Identidad Técnica', 
            key: 'sku',
            render: (val, row) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: '800', color: '#eab308' }}>{val}</span>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{row.brand}</span>
                </div>
            )
        },
        { label: 'Nombre Comercial', key: 'name' },
        { 
            label: 'Categoría', 
            key: 'category_name',
            render: (val, row) => (
                <span style={{ 
                    background: row._reconciled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: row._reconciled ? '#10b981' : '#f87171',
                    padding: '0.3rem 0.75rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: '600',
                    border: `1px solid ${row._reconciled ? '#10b98133' : '#f8717133'}`
                }}>
                    {val}
                </span>
            )
        }
    ];

    const strategies = [
        { label: 'Modo Espejo', value: 'OVERWRITE', icon: Zap },
        { label: 'Conservador', value: 'CONSERVATIVE', icon: ShieldCheck }
    ];

    return (
        <Layout>
            <div style={{ padding: '2rem' }}>
                <IndustrialIngestor
                    ref={ingestorRef}
                    title="Smart Discovery Hub"
                    subtitle="Alimentación automatizada de catálogo maestro desde fuentes oficiales."
                    icon={Rocket}
                    iconColor="#eab308"
                    onParse={handleParse}
                    onFilesDetected={handleFileDetected}
                    onPersist={handlePersist}
                    columns={columns}
                    ingestionStrategies={strategies}
                    processButtonText="Sincronizar Catálogo"
                    allowFiles={true}
                    accept=".html"
                    allowText={false}
                >
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <button onClick={() => setShowSkuMode(!showSkuMode)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 'bold' }}>
                            {showSkuMode ? <ChevronUp size={16} /> : <Globe size={16} />}
                            {showSkuMode ? 'Ocultar Búsqueda por SKUs' : '¿No tienes archivos? Buscar por SKUs directamente'}
                        </button>
                    </div>

                    {showSkuMode && (
                        <div style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '1.25rem', border: '1px solid #334155', boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <textarea
                                    placeholder="Pega tus códigos aquí (uno por línea)..."
                                    value={skuList}
                                    onChange={(e) => setSkuList(e.target.value)}
                                    style={{ flex: 1, background: '#0f172a', border: '1px solid #334155', borderRadius: '0.75rem', color: 'white', padding: '1rem', minHeight: '100px', fontSize: '0.85rem', outline: 'none' }}
                                />
                                <Button variant="primary" icon={Search} onClick={handleSkuLookup} loading={isSearching} disabled={!skuList.trim()}>
                                    Descubrir
                                </Button>
                            </div>
                        </div>
                    )}
                </IndustrialIngestor>

                {showSuccessModal && processSummary && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)' }}>
                        <div style={{ background: '#1e293b', padding: '3rem', borderRadius: '2rem', textAlign: 'center', maxWidth: '400px', border: '1px solid #eab308', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                            <div style={{ width: '64px', height: '64px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <CheckCircle size={40} color="#10b981" />
                            </div>
                            <h2 style={{ color: 'white', marginBottom: '1rem', fontWeight: '800' }}>¡Ingesta Completada!</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                                <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '1rem', border: '1px solid #334155' }}>
                                    <div style={{ fontSize: '1.5rem', color: '#10b981', fontWeight: 'bold' }}>{processSummary.created}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Nuevos Ítems</div>
                                </div>
                                <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '1rem', border: '1px solid #334155' }}>
                                    <div style={{ fontSize: '1.5rem', color: '#3b82f6', fontWeight: 'bold' }}>{processSummary.updated}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Actualizados</div>
                                </div>
                            </div>
                            <Button variant="primary" onClick={() => setShowSuccessModal(false)} style={{ width: '100%' }}>Finalizar Operación</Button>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default CatalogIngestion;
