import React, { useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { inventoryService, categoryService } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import { parseCatalogHtml } from '../utils/catalogParsers';
import Button from '../components/common/Button';
import { Upload, FileText, CheckCircle, AlertCircle, Trash2, Database, Rocket, Edit3, X } from 'lucide-react';
import Input from '../components/common/Input';

const CatalogIngestion = () => {
    const { showNotification } = useNotification();
    const [files, setFiles] = useState([]);
    const [dbCategories, setDbCategories] = useState([]);
    const [parsedProducts, setParsedProducts] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [skuList, setSkuList] = useState('');
    const [uploadStatus, setUploadStatus] = useState({ total: 0, current: 0, errors: [] });
    const [editingProduct, setEditingProduct] = useState(null);
    const [editingIndex, setEditingIndex] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [processSummary, setProcessSummary] = useState({ created: 0, updated: 0, skipped: 0, total: 0 });
    const [updateExisting, setUpdateExisting] = useState(true);

    // Fetch dynamic categories single-source-of-truth from Backend
    React.useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await categoryService.getCategories();
                if (res?.data) {
                    setDbCategories(res.data);
                }
            } catch (err) {
                console.error("No se pudieron cargar las categorías desde la BD:", err);
            }
        };
        fetchCategories();
    }, []);

    const handleFileDrop = (e) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer?.files || e.target.files);
        const htmlFiles = droppedFiles.filter(f => f.name.endsWith('.html'));

        if (htmlFiles.length === 0) {
            showNotification('Por favor, selecciona archivos .html válidos', 'error');
            return;
        }

        processFiles(htmlFiles);
    };

    const handleSkuLookup = async () => {
        const rawSkus = skuList.split('\n').map(s => s.trim()).filter(s => s !== '');
        const total = rawSkus.length;

        if (total === 0) {
            showNotification('Ingresa al menos un SKU', 'error');
            return;
        }

        console.log("Starting SKU Lookup for:", total, "items");
        setIsSearching(true);
        setUploadStatus({ total, current: 0, errors: [] });

        // Limpiar errores previos pero mantener productos ya encontrados
        setUploadStatus(prev => ({ ...prev, errors: [] }));

        // Procesar en pequeños grupos para no saturar y ver progreso real
        const batchSize = 3;
        let processedCount = 0;

        for (let i = 0; i < rawSkus.length; i += batchSize) {
            const batch = rawSkus.slice(i, i + batchSize);

            const results = await Promise.all(batch.map(async (sku) => {
                try {
                    const response = await inventoryService.externalLookup(sku);
                    const html = response.data.html;
                    if (html) {
                        const data = parseCatalogHtml(html, '', dbCategories);
                        if (data.sku) {
                            return { success: true, data: { ...data, _file: `Auto-Lookup: ${sku}`, _status: 'pending' } };
                        } else {
                            return { success: false, error: `${sku}: No encontrado en catálogo` };
                        }
                    }
                    return { success: false, error: `${sku}: Sin respuesta del servidor` };
                } catch (err) {
                    const detail = err.response?.data?.detail || err.message || 'Error de conexión';
                    return { success: false, error: `${sku}: ${detail}` };
                }
            }));

            // Actualizar estado progresivamente
            const foundInBatch = results.filter(r => r.success).map(r => r.data);
            const errorsInBatch = results.filter(r => !r.success).map(r => r.error);

            if (foundInBatch.length > 0) {
                setParsedProducts(prev => {
                    const filtered = foundInBatch.filter(newItem => 
                        !prev.some(existing => existing.sku === newItem.sku && existing.brand === newItem.brand)
                    );
                    
                    if (filtered.length < foundInBatch.length) {
                        showNotification(`${foundInBatch.length - filtered.length} productos omitidos por estar duplicados en la lista`, 'warning');
                    }
                    
                    return [...prev, ...filtered];
                });
            }

            processedCount += batch.length;
            setUploadStatus(prev => ({
                ...prev,
                current: processedCount,
                errors: [...prev.errors, ...errorsInBatch]
            }));

            // Pequeña pausa opcional para evitar bloqueos si la lista es gigante
            if (total > 50) await new Promise(r => setTimeout(r, 200));
        }

        setIsSearching(false);
        setSkuList(''); // Limpiar al terminar
        showNotification(`Búsqueda finalizada. Revisar resultados en la tabla.`, 'info');
        console.log("SKU Lookup finished.");
    };

    const processFiles = async (fileList) => {
        setIsParsing(true);
        setUploadStatus({ total: fileList.length, current: 0, errors: [] });
        const newProducts = [];
        
        try {
            for (let i = 0; i < fileList.length; i++) {
                const file = fileList[i];
                try {
                    const text = await file.text();
                    const data = parseCatalogHtml(text, file.name, dbCategories);
                    
                    if (data.sku) {
                        newProducts.push({
                            ...data,
                            _file: file.name,
                            _status: 'pending'
                        });
                    }
                } catch (err) {
                    console.error(`Error parsing ${file.name}:`, err);
                }
                
                setUploadStatus(prev => ({
                    ...prev,
                    current: i + 1
                }));
                
                if (i % 5 === 0) await new Promise(r => setTimeout(r, 10));
            }

            if (newProducts.length > 0) {
                // Realizar filtrado fuera del setter de estado para evitar efectos secundarios en render
                const filtered = newProducts.filter(newItem => 
                    !parsedProducts.some(existing => existing.sku === newItem.sku && existing.brand === newItem.brand)
                );
                
                const addedCount = filtered.length;
                const skippedCount = newProducts.length - filtered.length;
                
                if (skippedCount > 0) {
                    showNotification(`${addedCount} agregados, ${skippedCount} omitidos (duplicados en lista)`, 'warning');
                } else {
                    showNotification(`${addedCount} archivos procesados correctamente`, 'success');
                }
                
                setParsedProducts(prev => [...prev, ...filtered]);
            } else {
                showNotification('No se pudieron extraer productos de los archivos seleccionados', 'warning');
            }
        } catch (globalErr) {
            console.error("Error global en processFiles:", globalErr);
            showNotification('Error crítico al procesar archivos', 'error');
        } finally {
            setIsParsing(false);
        }
    };

    const removeProduct = (index) => {
        setParsedProducts(prev => prev.filter((_, i) => i !== index));
    };

    const handleEditProduct = (index) => {
        setEditingIndex(index);
        setEditingProduct({ ...parsedProducts[index] });
    };

    const isCategoryRecognized = (catName) => {
        if (!catName) return false;
        const upperName = catName.toUpperCase();
        return dbCategories.some(c => 
            c.import_aliases && c.import_aliases.some(a => a.toUpperCase() === upperName)
        );
    };

    const handleSaveProduct = () => {
        const newProducts = [...parsedProducts];
        newProducts[editingIndex] = editingProduct;
        setParsedProducts(newProducts);
        setEditingProduct(null);
        setEditingIndex(null);
        showNotification('Producto actualizado en la lista', 'info');
    };

    const handleBulkUpload = async () => {
        if (parsedProducts.length === 0) return;

        setIsProcessing(true);
        setUploadStatus({ total: parsedProducts.length, current: 0, errors: [] });

        try {
            // Clean internal properties before sending to server
            const productsToUpload = parsedProducts.map(({ _file, _status, ...rest }) => rest);

            const response = await inventoryService.bulkCreateProducts(productsToUpload, updateExisting);
            
            setProcessSummary(response.data);
            setShowSuccessModal(true);
            showNotification('¡Ingesta masiva completada con éxito!', 'success');
            setParsedProducts([]); // Clear table on success
        } catch (error) {
            console.error("Bulk upload error:", error);

            // Extract meaningful message from Pydantic or generic error
            let errorMsg = error.message;
            if (error.response?.data?.detail) {
                const detail = error.response.data.detail;
                if (typeof detail === 'string') {
                    errorMsg = detail;
                } else if (Array.isArray(detail)) {
                    // Pydantic validation errors
                    errorMsg = detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join(' | ');
                } else if (typeof detail === 'object') {
                    errorMsg = JSON.stringify(detail);
                }
            }

            showNotification(`Error en la carga masiva: ${errorMsg}`, 'error');
            setUploadStatus(prev => ({ ...prev, errors: [...prev.errors, errorMsg] }));
        } finally {
            setIsProcessing(false);
        }
    };

    const dropzoneStyle = {
        border: '3px dashed #334155',
        borderRadius: '1rem',
        padding: '3rem',
        textAlign: 'center',
        background: '#1e293b',
        cursor: 'pointer',
        transition: 'all 0.2s',
        marginBottom: '2rem'
    };

    return (
        <Layout>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Rocket size={32} color="#eab308" />
                            Ingesta Inteligente de Catálogo
                        </h1>
                        <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
                            Sube archivos HTML o ingresa códigos SKU para poblar tu inventario automáticamente desde fuentes oficiales. 
                            <span style={{ color: '#60a5fa', fontWeight: 'bold', marginLeft: '0.5rem' }}>
                                (Los productos existentes se actualizarán con la nueva información)
                            </span>
                        </p>
                    </div>
                    {parsedProducts.length > 0 && (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setParsedProducts([]);
                                    setUploadStatus({ total: 0, current: 0, errors: [] });
                                }}
                                disabled={isProcessing}
                            >
                                Limpiar Todo
                            </Button>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0f172a', padding: '0.5rem 1rem', borderRadius: '0.75rem', border: '1px solid #334155' }}>
                                <input 
                                    type="checkbox" 
                                    id="update-existing-check"
                                    checked={updateExisting}
                                    onChange={(e) => setUpdateExisting(e.target.checked)}
                                    style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                                />
                                <label htmlFor="update-existing-check" style={{ color: '#94a3b8', fontSize: '0.9rem', cursor: 'pointer', userSelect: 'none' }}>
                                    Actualizar productos existentes
                                </label>
                            </div>
                            <Button
                                variant="primary"
                                onClick={handleBulkUpload}
                                loading={isProcessing}
                                style={{ background: '#eab308', color: '#000', fontWeight: 'bold' }}
                            >
                                <Database size={18} style={{ marginRight: '0.5rem' }} />
                                Procesar {parsedProducts.length} Productos
                            </Button>
                        </div>
                    )}
                </div>

                {/* Sección de Ingesta por SKU */}
                <div style={{
                    background: '#1e293b',
                    borderRadius: '1rem',
                    border: '1px solid #334155',
                    padding: '1.5rem',
                    marginBottom: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    <h3 style={{ color: 'white', margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Database size={18} color="#eab308" />
                        Opción A: Ingesta por Códigos (Auto-Lookup)
                    </h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
                        Ingresa uno o más códigos (SKU) separados por salto de línea para buscarlos en el catálogo oficial de WIX/Filtron/Asakashi (OEM)/Azumi.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <textarea
                            placeholder="WA6214&#10;WA6215&#10;..."
                            value={skuList}
                            onChange={(e) => setSkuList(e.target.value)}
                            disabled={isSearching}
                            style={{
                                flex: 1,
                                background: '#0f172a',
                                border: '1px solid #334155',
                                borderRadius: '0.5rem',
                                color: 'white',
                                padding: '0.75rem',
                                minHeight: '80px',
                                fontFamily: 'monospace',
                                resize: 'vertical',
                                opacity: isSearching ? 0.5 : 1
                            }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '150px' }}>
                            <Button
                                variant="primary"
                                onClick={handleSkuLookup}
                                loading={isSearching}
                                disabled={!skuList.trim() || isProcessing}
                                style={{ alignSelf: 'stretch' }}
                            >
                                🔍 Buscar en Catálogo
                            </Button>
                            {isSearching && (
                                <div style={{ fontSize: '0.75rem', color: '#eab308', textAlign: 'center', fontWeight: 'bold' }}>
                                    Procesando {uploadStatus.current} de {uploadStatus.total}...
                                </div>
                            )}
                        </div>
                    </div>
                    {isSearching && (
                        <div style={{ width: '100%', height: '4px', background: '#0f172a', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${(uploadStatus.current / uploadStatus.total) * 100}%`,
                                height: '100%',
                                background: '#eab308',
                                transition: 'width 0.3s'
                            }} />
                        </div>
                    )}
                </div>

                {/* Sección de Archivos */}
                <div style={{ marginBottom: '1rem' }}>
                    <h3 style={{ color: 'white', margin: '0 0 1rem 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Upload size={18} color="#eab308" />
                        Opción B: Subir Archivos HTML
                    </h3>
                </div>

                {parsedProducts.length === 0 ? (
                    <div
                        style={dropzoneStyle}
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#eab308'; }}
                        onDragLeave={(e) => { e.currentTarget.style.borderColor = '#334155'; }}
                        onDrop={handleFileDrop}
                        onClick={() => document.getElementById('bulk-file-input').click()}
                    >
                        <input
                            type="file"
                            id="bulk-file-input"
                            multiple
                            accept=".html"
                            style={{ display: 'none' }}
                            onChange={handleFileDrop}
                        />
                        <Upload size={48} color="#94a3b8" style={{ marginBottom: '1rem' }} />
                        <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Arrastra tus archivos HTML aquí</h3>
                        <p style={{ color: '#64748b' }}>O haz clic para seleccionar archivos desde tu computadora</p>
                    </div>
                ) : (
                    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '1rem', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e2e8f0' }}>
                            <thead style={{ background: '#0f172a', borderBottom: '1px solid #334155' }}>
                                <tr>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>SKU</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Nombre</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Categoría</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Marca</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Medidas</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Aplicaciones</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Equivalencias</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parsedProducts.map((p, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #33415577' }}>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{p.sku}</td>
                                        <td style={{ padding: '1rem' }}>{p.name}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ 
                                                background: isCategoryRecognized(p.category_name) ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
                                                color: isCategoryRecognized(p.category_name) ? '#10b981' : '#f87171',
                                                padding: '0.4rem 0.8rem', 
                                                borderRadius: '0.75rem', 
                                                fontSize: '0.75rem',
                                                fontWeight: '900',
                                                border: `1px solid ${isCategoryRecognized(p.category_name) ? '#10b98133' : '#f8717133'}`,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.4rem'
                                            }}>
                                                {p.category_name || 'Sin Categoría'}
                                                {!isCategoryRecognized(p.category_name) ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ 
                                                background: '#0f172a', 
                                                color: '#3b82f6',
                                                padding: '0.2rem 0.5rem', 
                                                borderRadius: '0.4rem', 
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                border: '1px solid #334155'
                                            }}>
                                                {p.brand}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <span style={{ background: '#334155', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem' }}>
                                                {p.specs.length}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <span style={{ background: '#334155', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem' }}>
                                                {p.applications.length}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <span style={{ 
                                                background: p.equivalences?.length > 0 ? '#1e3a8a' : '#334155', 
                                                color: p.equivalences?.length > 0 ? '#60a5fa' : '#94a3b8',
                                                padding: '0.2rem 0.6rem', 
                                                borderRadius: '1rem', 
                                                fontSize: '0.8rem',
                                                fontWeight: p.equivalences?.length > 0 ? 'bold' : 'normal',
                                                border: p.equivalences?.length > 0 ? '1px solid #3b82f6' : '1px solid transparent'
                                            }}>
                                                {p.equivalences?.length || 0}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => handleEditProduct(idx)}
                                                style={{ border: 'none', background: '#3b82f6', color: 'white', padding: '0.4rem', borderRadius: '0.4rem', cursor: 'pointer' }}
                                                title="Editar datos"
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            <button
                                                onClick={() => removeProduct(idx)}
                                                style={{ border: 'none', background: '#ef4444', color: 'white', padding: '0.4rem', borderRadius: '0.4rem', cursor: 'pointer' }}
                                                title="Eliminar de la lista"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {uploadStatus.errors.length > 0 && (
                    <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#450a0a', border: '1px solid #991b1b', borderRadius: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', fontWeight: 'bold', marginBottom: '1rem' }}>
                            <AlertCircle size={20} />
                            Errores durante la carga
                        </div>
                        <ul style={{ color: '#fca5a5', fontSize: '0.9rem', margin: 0 }}>
                            {uploadStatus.errors.map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                    </div>
                )}
            </div>

            {/* Modal de Edición */}
            {editingProduct && (
                <div style={{
                    position: 'fixed', inset: 0, background: '#000000aa', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
                }}>
                    <div style={{
                        background: '#1e293b', width: '100%', maxWidth: '600px', borderRadius: '1rem', border: '1px solid #334155', display: 'flex', flexDirection: 'column', maxHeight: '90vh'
                    }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem' }}>Editar Datos Extraídos</h2>
                            <button onClick={() => setEditingProduct(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', flexGrow: 1 }}>
                            {/* Visual & Main Data Section */}
                            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1.5rem' }}>
                                {/* Image Container */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{
                                        background: '#0f172a', borderRadius: '0.75rem', border: '1px solid #334155', position: 'relative', overflow: 'hidden',
                                        aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem'
                                    }}>
                                        <img
                                            src={editingProduct._showTech && editingProduct.tech_drawing_url ? editingProduct.tech_drawing_url : editingProduct.image_url}
                                            alt={editingProduct.sku}
                                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                            onError={(e) => { e.target.src = 'https://placehold.co/200x200?text=Sin+Imagen'; }}
                                        />

                                        {editingProduct.manual_pdf_url && (
                                            <a
                                                href={editingProduct.manual_pdf_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{
                                                    position: 'absolute', top: '5px', right: '5px', background: '#ef4444', color: 'white', padding: '4px 8px',
                                                    borderRadius: '4px', fontSize: '0.65rem', textDecoration: 'none', fontWeight: 'bold'
                                                }}
                                            >
                                                PDF
                                            </a>
                                        )}
                                    </div>

                                    {editingProduct.tech_drawing_url && (
                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                            <button
                                                onClick={() => setEditingProduct({ ...editingProduct, _showTech: false })}
                                                style={{ flex: 1, padding: '4px', fontSize: '0.7rem', borderRadius: '4px', background: !editingProduct._showTech ? '#3b82f6' : '#1e293b', border: '1px solid #334155', color: 'white', cursor: 'pointer' }}
                                            >
                                                📷 Foto
                                            </button>
                                            <button
                                                onClick={() => setEditingProduct({ ...editingProduct, _showTech: true })}
                                                style={{ flex: 1, padding: '4px', fontSize: '0.7rem', borderRadius: '4px', background: editingProduct._showTech ? '#3b82f6' : '#1e293b', border: '1px solid #334155', color: 'white', cursor: 'pointer' }}
                                            >
                                                📐 Plano
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Main Inputs */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                        <Input
                                            label="SKU"
                                            value={editingProduct.sku}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                                        />
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Marca</label>
                                            <select
                                                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', color: 'white', padding: '0.65rem' }}
                                                value={editingProduct.brand}
                                                onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                                            >
                                                <option value="WIX">WIX</option>
                                                <option value="FILTRON">FILTRON</option>
                                                <option value="OEM">OEM</option>
                                                <option value="AZUMI">AZUMI</option>
                                                <option value="GENERIC">GENÉRICO</option>
                                                <option value="JS ASAKASHI">JS ASAKASHI</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Categoría Detectada</label>
                                        <select
                                            style={{ 
                                                width: '100%', 
                                                background: '#0f172a', 
                                                border: isCategoryRecognized(editingProduct.category_name) ? '1px solid #334155' : '2px solid #ef4444', 
                                                borderRadius: '0.5rem', 
                                                color: 'white', 
                                                padding: '0.65rem' 
                                            }}
                                            value={editingProduct.category_name}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, category_name: e.target.value })}
                                        >
                                            <option value="">-- Seleccionar Categoría --</option>
                                            {dbCategories.map(cat => (
                                                <option key={cat._id} value={cat.name}>{cat.name}</option>
                                            ))}
                                            {editingProduct.category_name && !isCategoryRecognized(editingProduct.category_name) && (
                                                <option value={editingProduct.category_name}>
                                                    [HUÉRFANO] {editingProduct.category_name}
                                                </option>
                                            )}
                                        </select>
                                    </div>
                                    <Input
                                        label="EAN (Código de Barras)"
                                        value={editingProduct.ean}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, ean: e.target.value })}
                                    />
                                    <Input
                                        label="Nombre del Producto"
                                        value={editingProduct.name}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                    />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                        <Input
                                            label="Peso (g)"
                                            type="number"
                                            value={editingProduct.weight_g}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, weight_g: parseFloat(e.target.value) || 0 })}
                                        />
                                        <Input
                                            label="Forma / Estilo"
                                            value={editingProduct.shape}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, shape: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Technical Bulletin */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <i className="fas fa-sticky-note" style={{ color: '#60a5fa' }}></i> Boletín Técnico / Notas
                                </label>
                                <textarea
                                    style={{
                                        width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', color: 'white', padding: '0.75rem', minHeight: '60px', fontSize: '0.85rem', resize: 'vertical'
                                    }}
                                    value={editingProduct.tech_bulletin}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, tech_bulletin: e.target.value })}
                                />
                            </div>

                            {/* Technical Specs */}
                            <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                                <h4 style={{ color: '#eab308', marginTop: 0, marginBottom: '0.75rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    📐 Medidas Técnicas
                                </h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {editingProduct.specs.map((s, i) => (
                                        <div key={i} style={{ background: '#1e293b', border: '1px solid #334155', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
                                            <span style={{ color: '#94a3b8' }}>{s.label}: </span>
                                            <span style={{ fontWeight: 'bold' }}>{s.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Equivalences */}
                            <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                                <h4 style={{ color: '#60a5fa', marginTop: 0, marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                                    🔗 Equivalencias ({editingProduct.equivalences.length})
                                </h4>
                                <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                    {editingProduct.equivalences.map((eq, i) => (
                                        <div key={i} style={{
                                            background: eq.is_original ? '#1e3a8a' : '#1e293b',
                                            border: eq.is_original ? '1px solid #3b82f6' : '1px solid #33415577',
                                            padding: '0.3rem 0.6rem', borderRadius: '0.4rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
                                        }}>
                                            {eq.is_original && (
                                                <span style={{ background: '#3b82f6', color: 'white', fontSize: '0.6rem', padding: '1px 4px', borderRadius: '3px', fontWeight: 'bold' }}>OE</span>
                                            )}
                                            <span style={{ color: '#94a3b8' }}>{eq.brand}:</span>
                                            <span style={{ fontWeight: 'bold' }}>{eq.code}</span>
                                            <button
                                                onClick={() => {
                                                    const newEq = editingProduct.equivalences.filter((_, idx) => idx !== i);
                                                    setEditingProduct({ ...editingProduct, equivalences: newEq });
                                                }}
                                                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0 }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    {editingProduct.equivalences.length === 0 && <span style={{ color: '#64748b', fontSize: '0.8rem' }}>No se encontraron equivalencias.</span>}
                                </div>
                            </div>

                            {/* Applications */}
                            <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                                <h4 style={{ color: '#34d399', marginTop: 0, marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                                    🚗 Aplicaciones Vehiculares ({editingProduct.applications.length})
                                </h4>
                                <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '0.8rem' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead style={{ position: 'sticky', top: 0, background: '#161e2e', color: '#94a3b8' }}>
                                            <tr>
                                                <th style={{ textAlign: 'left', padding: '0.4rem' }}>Marca</th>
                                                <th style={{ textAlign: 'left', padding: '0.4rem' }}>Modelo</th>
                                                <th style={{ textAlign: 'left', padding: '0.4rem' }}>Notas/Motor</th>
                                                <th style={{ textAlign: 'left', padding: '0.4rem' }}>Año</th>
                                                <th style={{ textAlign: 'right', padding: '0.4rem' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {editingProduct.applications.map((app, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #33415544' }}>
                                                    <td style={{ padding: '0.4rem' }}>{app.make}</td>
                                                    <td style={{ padding: '0.4rem' }}>{app.model}</td>
                                                    <td style={{ padding: '0.4rem' }}>
                                                        <div style={{ color: '#60a5fa', fontWeight: 'bold' }}>{app.engine}</div>
                                                        <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{app.notes}</div>
                                                    </td>
                                                    <td style={{ padding: '0.4rem' }}>{app.year}</td>
                                                    <td style={{ padding: '0.4rem', textAlign: 'right' }}>
                                                        <button
                                                            onClick={() => {
                                                                const newApp = editingProduct.applications.filter((_, idx) => idx !== i);
                                                                setEditingProduct({ ...editingProduct, applications: newApp });
                                                            }}
                                                            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                                                        >
                                                            ×
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {editingProduct.applications.length === 0 && <div style={{ padding: '1rem', color: '#64748b', textAlign: 'center' }}>No se encontraron aplicaciones.</div>}
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '1.25rem', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <Button variant="secondary" onClick={() => setEditingProduct(null)}>Cancelar</Button>
                            <Button variant="primary" onClick={handleSaveProduct} style={{ background: '#eab308', color: '#000' }}>
                                Guardar Cambios
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Overlay de Procesamiento de Archivos (Nuevo) */}
            {isParsing && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(15, 23, 42, 0.9)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    backdropFilter: 'blur(8px)'
                }}>
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ 
                            fontSize: '4rem', 
                            marginBottom: '1.5rem',
                            animation: 'bounce 1s infinite'
                        }}>📂</div>
                        <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                            Analizando Catálogos HTML...
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
                            Procesando {uploadStatus.current} de {uploadStatus.total} archivos.
                        </p>
                        
                        <div style={{ 
                            marginTop: '2rem', 
                            width: '300px', 
                            height: '6px', 
                            background: '#334155', 
                            borderRadius: '3px', 
                            overflow: 'hidden' 
                        }}>
                            <div style={{
                                width: `${(uploadStatus.current / uploadStatus.total) * 100}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #3b82f6, #60a5fa, #3b82f6)',
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 1.5s infinite linear'
                            }} />
                        </div>
                    </div>
                </div>
            )}

            {/* Overlay de Procesamiento Masivo Final */}
            {isProcessing && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(15, 23, 42, 0.9)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    backdropFilter: 'blur(8px)'
                }}>
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <Rocket 
                            size={64} 
                            color="#eab308" 
                            style={{ 
                                animation: 'bounce 1s infinite', 
                                marginBottom: '1.5rem' 
                            }} 
                        />
                        <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                            Ingestando Productos...
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
                            Por favor espera, estamos procesando {parsedProducts.length} productos en el servidor.
                        </p>
                        
                        <div style={{ 
                            marginTop: '2rem', 
                            width: '300px', 
                            height: '6px', 
                            background: '#334155', 
                            borderRadius: '3px', 
                            overflow: 'hidden' 
                        }}>
                            <div style={{
                                width: '100%',
                                height: '100%',
                                background: 'linear-gradient(90deg, #eab308, #3b82f6, #eab308)',
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 1.5s infinite linear'
                            }} />
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Éxito Profesional */}
            {showSuccessModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '1rem', backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        background: '#1e293b', width: '100%', maxWidth: '500px', borderRadius: '2rem', border: '1px solid #334155', padding: '3rem', textAlign: 'center',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)', animation: 'slideUp 0.4s ease-out'
                    }}>
                        <div style={{
                            width: '100px', height: '100px', background: 'rgba(52, 211, 153, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem',
                            border: '2px solid #34d399'
                        }}>
                            <CheckCircle size={56} color="#34d399" />
                        </div>
                        
                        <h2 style={{ color: 'white', fontSize: '2.25rem', marginBottom: '0.5rem', fontWeight: '800' }}>
                            ¡Ingesta Completada!
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
                            El procesamiento de catálogo ha finalizado exitosamente.
                        </p>
                        
                        <div style={{ 
                            background: '#0f172a', 
                            padding: '1.5rem', 
                            borderRadius: '1.25rem', 
                            color: '#94a3b8', 
                            textAlign: 'left', 
                            marginBottom: '2.5rem',
                            border: '1px solid #1e293b'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#34d399' }} />
                                    Productos Nuevos:
                                </span>
                                <span style={{ color: '#34d399', fontWeight: '800', fontSize: '1.25rem' }}>{processSummary.created}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#3b82f6' }} />
                                    Actualizados:
                                </span>
                                <span style={{ color: '#3b82f6', fontWeight: '800', fontSize: '1.25rem' }}>{processSummary.updated}</span>
                            </div>
                            {processSummary.skipped > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#64748b' }} />
                                        Omitidos (Ya existen):
                                    </span>
                                    <span style={{ color: '#64748b', fontWeight: '800', fontSize: '1.25rem' }}>{processSummary.skipped}</span>
                                </div>
                            )}
                            <div style={{ height: '1px', background: '#334155', margin: '0.75rem 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', alignItems: 'center' }}>
                                <span style={{ color: 'white', fontWeight: 'bold' }}>Total Procesados:</span>
                                <span style={{ color: 'white', fontWeight: '800', fontSize: '1.5rem' }}>{processSummary.total}</span>
                            </div>
                        </div>
                        
                        <Button 
                            variant="primary" 
                            onClick={() => setShowSuccessModal(false)}
                            style={{ 
                                background: 'linear-gradient(135deg, #34d399, #10b981)', 
                                color: '#064e3b', 
                                fontWeight: '900', 
                                padding: '1rem 3rem', 
                                width: '100%',
                                fontSize: '1.1rem',
                                borderRadius: '1rem',
                                boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)'
                            }}
                        >
                            Finalizar y Cerrar
                        </Button>
                    </div>
                </div>
            )}

            {/* Estilos Globales para Animaciones */}
            <style>{`
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </Layout>
    );
};

export default CatalogIngestion;
