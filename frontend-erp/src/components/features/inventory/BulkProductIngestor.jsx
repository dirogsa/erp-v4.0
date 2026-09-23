import React, { useRef, useState, useEffect } from 'react';
import IndustrialIngestor from '../../common/IndustrialIngestor';
import { parseCatalogHtml } from '../../../utils/catalogParsers';
import { Package, ShieldCheck } from 'lucide-react';
import { inventoryService, categoryService } from '../../../services/api';
import { useNotification } from '../../../hooks/useNotification';

const BulkProductIngestor = ({ onComplete, onCancel }) => {
    const ingestorRef = useRef();
    const { showNotification } = useNotification();
    const [categories, setCategories] = useState([]);
    const [ingestMode, setIngestMode] = useState('JSON');

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await categoryService.getCategories();
                setCategories(res.data);
            } catch (error) {
                console.error("Error loading categories", error);
            }
        };
        fetchCategories();
    }, []);

    // Motor de Parsing Universal JSON
    const parseJsonProduct = (text, fileName) => {
        try {
            const json = JSON.parse(text);
            const data = json.product || json;
            
            let overrideSku = data.item_code || data.sku || data.code;
            let overrideBrand = data.pref || data.brand;
            
            // Priorizar extracción del nombre de archivo (SKU_MARCA.json)
            if (fileName && fileName.includes('_')) {
                const nameWithoutExt = fileName.split('.').slice(0, -1).join('.');
                const parts = nameWithoutExt.split('_');
                if (parts.length >= 2) {
                    overrideBrand = parts.pop().toUpperCase();
                    overrideSku = parts.join('_').toUpperCase();
                }
            }
            
            const equivalences = [];
            if (data.oems) {
                data.oems.forEach(oem => equivalences.push({ brand: oem.brand || 'OEM', code: oem.code, is_original: true }));
            }
            if (data.refs) {
                data.refs.forEach(ref => equivalences.push({ brand: ref.brand || 'REF', code: ref.code, is_original: false }));
            }
            
            const applications = [];
            if (data.car_model_types) {
                data.car_model_types.forEach(car => {
                    const make = car.brand?.title || car.brand || '';
                    const model = car.model?.name || car.model || '';
                    const yearStart = car.date_start ? car.date_start.split('-')[0] : '';
                    const yearEnd = car.date_end ? car.date_end.split('-')[0] : '';
                    const year = car.year || (yearStart || yearEnd ? `${yearStart} - ${yearEnd}` : '');

                    applications.push({
                        make: make,
                        model: model,
                        engine: car.name || car.engine || car.motor || '',
                        year: year
                    });
                });
            }
            
            return {
                sku: overrideSku || 'SIN_SKU',
                brand: overrideBrand || 'SIN_MARCA',
                name: data.name || `${overrideBrand} ${overrideSku}`,
                equivalences: equivalences,
                applications: applications,
                image_url: data.image_url || '',
                specs: data.info ? data.info.map(i => ({ 
                    label: i.name || 'Spec', 
                    value: String(i.code || i.value || ''), 
                    measure_type: (i.name && (i.name.toLowerCase().includes('mm') || /height|width|length|diameter/i.test(i.name))) ? 'mm' : 'other'
                })) : []
            };
        } catch (e) {
            console.error("Error parsing JSON:", e);
            return null;
        }
    };

    // Motor de Parsing para Productos (HTML Texto pegado)
    const handleParse = (text) => {
        if (ingestMode === 'JSON') {
            const parsed = parseJsonProduct(text, '');
            return parsed ? [parsed] : [];
        } else {
            const parsed = parseCatalogHtml(text, '', categories);
            return parsed ? [parsed] : [];
        }
    };

    // Motor de Procesamiento de Archivos HTML / JSON
    const handleFiles = async (files) => {
        const allDetected = [];
        for (const file of files) {
            try {
                const text = await file.text();
                let parsed = null;
                if (ingestMode === 'JSON' && file.name.toLowerCase().endsWith('.json')) {
                    parsed = parseJsonProduct(text, file.name);
                } else if (ingestMode === 'HTML' && file.name.toLowerCase().endsWith('.html')) {
                    parsed = parseCatalogHtml(text, file.name, categories);
                }
                
                if (parsed) {
                    allDetected.push({ ...parsed, id: parsed.sku });
                }
            } catch (err) {
                console.error(`Error leyendo archivo ${file.name}:`, err);
            }
        }
        
        if (allDetected.length > 0) {
            ingestorRef.current.addItems(allDetected);
        }
    };

    // Motor de Persistencia
    const handlePersist = async (items, strategy) => {
        try {
            const payloads = items.map(entity => {
                const payload = {
                    ...entity,
                    type: 'COMMERCIAL',
                    is_active_in_shop: true
                };
                
                // Limpiar atributos inyectados para la UI que rompen el modelo de backend
                delete payload.id;
                
                // Si la categoría no viene con ID (solo nombre), buscarla
                if (entity.category_name && !entity.category_id && categories.length > 0) {
                    const match = categories.find(c => c.name.toLowerCase() === entity.category_name.toLowerCase());
                    if (match) payload.category_id = match._id;
                }
                
                return payload;
            });

            const updateExisting = strategy === 'OVERWRITE';
            
            // Inyección Masiva (Bulk Upsert)
            const response = await inventoryService.bulkCreateProducts(payloads, updateExisting);
            
            const resData = response.data || {};
            const created = resData.created || resData.imported || resData.created_count || 0;
            const updated = resData.updated || resData.updated_count || 0;
            
            if (updateExisting) {
                showNotification(`Proceso exitoso: Se crearon ${created} nuevos y se actualizaron/sobrescribieron ${updated} productos.`, 'success', { mode: 'dialog' });
            } else {
                showNotification(`Proceso exitoso: Se inyectaron ${created} productos nuevos (ignorando existentes).`, 'success', { mode: 'dialog' });
            }
            
        } catch (error) {
            console.error("Error crítico durante la inyección masiva:", error);
            showNotification("Hubo un error al inyectar el lote de productos al maestro.", "error", { mode: 'dialog' });
        }
        
        if (onComplete) onComplete();
    };

    const columns = [
        { 
            label: 'Identificador (SKU)', 
            key: 'sku',
            render: (val, row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.75rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                        <Package size={18} color="#3b82f6" />
                    </div>
                    <div>
                        <div style={{ fontWeight: '900', color: '#3b82f6', fontFamily: "'JetBrains Mono', monospace", fontSize: '1.1rem', letterSpacing: '0.05em' }}>
                            {val}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.1rem' }}>
                            {row.brand}
                        </div>
                    </div>
                </div>
            )
        },
        { 
            label: 'Descripción / Nombre', 
            key: 'name',
            render: (val) => <span style={{ color: 'white', fontWeight: '700', fontSize: '1rem' }}>{val}</span>
        },
        {
            label: 'Métricas Extraídas',
            key: 'metrics',
            render: (val, row) => (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {row.image_url && <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: '700' }}>Imagen ✓</span>}
                    {row.specs && row.specs.length > 0 && <span style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: '700' }}>{row.specs.length} Specs</span>}
                    {row.applications && row.applications.length > 0 && <span style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: '700' }}>{row.applications.length} Apps</span>}
                    {row.equivalences && row.equivalences.length > 0 && <span style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: '700' }}>{row.equivalences.length} Equivs</span>}
                </div>
            )
        }
    ];

    const strategies = [
        { label: 'SOBRESCRIBIR EXISTENTES', value: 'OVERWRITE' },
        { label: 'SOLO NUEVOS (IGNORAR)', value: 'IGNORE' }
    ];

    return (
        <div style={{ padding: '1rem 0' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button 
                    onClick={() => { setIngestMode('JSON'); if (ingestorRef.current) ingestorRef.current.clear(); }}
                    style={{ 
                        flex: 1, padding: '1rem', borderRadius: '1rem', fontWeight: 'bold', fontSize: '1.1rem',
                        background: ingestMode === 'JSON' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${ingestMode === 'JSON' ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
                        color: ingestMode === 'JSON' ? '#60a5fa' : '#94a3b8',
                        cursor: 'pointer', transition: 'all 0.2s'
                    }}
                >
                    📦 Modo JSON (Universal Estructurado)
                </button>
                <button 
                    onClick={() => { setIngestMode('HTML'); if (ingestorRef.current) ingestorRef.current.clear(); }}
                    style={{ 
                        flex: 1, padding: '1rem', borderRadius: '1rem', fontWeight: 'bold', fontSize: '1.1rem',
                        background: ingestMode === 'HTML' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${ingestMode === 'HTML' ? '#f59e0b' : 'rgba(255,255,255,0.1)'}`,
                        color: ingestMode === 'HTML' ? '#fbbf24' : '#94a3b8',
                        cursor: 'pointer', transition: 'all 0.2s'
                    }}
                >
                    🌐 Modo HTML (Wix / Filtron / Azumi)
                </button>
            </div>
            
            <IndustrialIngestor
                ref={ingestorRef}
                title={`Laboratorio de Ingesta de Catálogos (${ingestMode})`}
                subtitle={ingestMode === 'JSON' ? "Procesa catálogos universales en formato JSON de manera estructurada." : "Procesa masivamente páginas de catálogos web legacy (Wix, Filtron, Azumi)."}
                icon={Package}
                iconColor={ingestMode === 'JSON' ? "#3b82f6" : "#f59e0b"}
                onParse={handleParse}
                onFilesDetected={handleFiles}
                onPersist={handlePersist}
                columns={columns}
                ingestionStrategies={strategies}
                initialStrategy="OVERWRITE"
                previewTitle="Productos Listos para Inyectar al Maestro"
                processButtonText="Inyectar al Maestro"
                allowText={false}
                accept={ingestMode === 'JSON' ? ".json" : ".html"}
            />
        </div>
    );
};

export default BulkProductIngestor;

