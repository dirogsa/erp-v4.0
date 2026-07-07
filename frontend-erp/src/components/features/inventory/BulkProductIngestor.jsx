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

    // Motor de Parsing para Productos (HTML Texto pegado)
    const handleParse = (text) => {
        const parsed = parseCatalogHtml(text, '', categories);
        return parsed ? [parsed] : [];
    };

    // Motor de Procesamiento de Archivos HTML
    const handleFiles = async (files) => {
        const allDetected = [];
        for (const file of files) {
            try {
                const text = await file.text();
                const parsed = parseCatalogHtml(text, file.name, categories);
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
            // Esto delega la lógica de existencia al backend (MongoDB) y evita los "falsos errores 409" en la consola del navegador.
            const response = await inventoryService.bulkCreateProducts(payloads, updateExisting);
            
            // response.data es típicamente { imported: X, updated: Y, errors: Z }
            const resData = response.data || {};
            const created = resData.imported || resData.created_count || 0;
            const updated = resData.updated || resData.updated_count || 0;
            
            if (updateExisting) {
                showNotification(`Proceso exitoso: Se crearon ${created} nuevos y se actualizaron/sobrescribieron ${updated} productos.`, 'success');
            } else {
                showNotification(`Proceso exitoso: Se inyectaron ${created} productos nuevos (ignorando existentes).`, 'success');
            }
            
        } catch (error) {
            console.error("Error crítico durante la inyección masiva:", error);
            showNotification("Hubo un error al inyectar el lote de productos al maestro.", "error");
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
            <IndustrialIngestor
                ref={ingestorRef}
                title="Laboratorio de Ingesta de Catálogos (HTML)"
                subtitle="Procesa masivamente páginas de catálogos web de fabricantes (Wix, Filtron, LYS, etc.)"
                icon={Package}
                iconColor="#3b82f6"
                onParse={handleParse}
                onFilesDetected={handleFiles}
                onPersist={handlePersist}
                columns={columns}
                ingestionStrategies={strategies}
                initialStrategy="OVERWRITE"
                previewTitle="Productos Listos para Inyectar al Maestro"
                processButtonText="Inyectar al Maestro"
                allowText={false}
                accept=".html"
            />
        </div>
    );
};

export default BulkProductIngestor;
