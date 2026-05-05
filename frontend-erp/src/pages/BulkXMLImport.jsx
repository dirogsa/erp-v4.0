import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import XMLImportModal from '../components/common/XMLImportModal';
import XMLReviewModal from '../components/common/XMLReviewModal';
import { salesService, purchasingService, salesQuotesService, purchaseQuotesService } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import Button from '../components/common/Button';
import { FileText, Upload, CheckCircle, AlertCircle, Rocket, Database, ShoppingCart, Tag } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import LoadingOverlay from '../components/common/LoadingOverlay';

const BulkXMLImport = () => {
    const { showNotification } = useNotification();
    const [importType, setImportType] = useState(() => {
        return localStorage.getItem('erp_xml_import_type') || 'SALES';
    });
    const [showXMLImportModal, setShowXMLImportModal] = useState(false);
    const [xmlBatch, setXmlBatch] = useState(() => {
        const saved = localStorage.getItem('erp_xml_batch');
        return saved ? JSON.parse(saved) : [];
    });
    const [selectedXmlForReview, setSelectedXmlForReview] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Progress state
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);
    const [totalToProcess, setTotalToProcess] = useState(0);
    const [currentProcessing, setCurrentProcessing] = useState(0);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lastProcessedCount, setLastProcessedCount] = useState({ created: 0, skipped: 0, pending: 0 });
    
    // Sync to localStorage
    useEffect(() => {
        localStorage.setItem('erp_xml_batch', JSON.stringify(xmlBatch));
    }, [xmlBatch]);

    useEffect(() => {
        localStorage.setItem('erp_xml_import_type', importType);
    }, [importType]);
    
    // Filtering
    const [filter, setFilter] = useState('ALL'); // ALL, SUCCESS, ERROR, PENDING, DUPLICATE

    const isDuplicate = (doc) => {
        if (!doc.errorMsg) return false;
        const msg = doc.errorMsg.toLowerCase();
        return msg.includes('ya existe') || msg.includes('duplicado') || msg.includes('already exists');
    };

    const counts = {
        all: xmlBatch.length,
        success: xmlBatch.filter(d => d.status === 'SUCCESS').length,
        error: xmlBatch.filter(d => d.status === 'ERROR' && !isDuplicate(d)).length,
        duplicate: xmlBatch.filter(d => isDuplicate(d)).length,
        pending: xmlBatch.filter(d => !d.status).length,
        reprocessable: xmlBatch.filter(d => {
            if (d.status === 'SUCCESS' || isDuplicate(d)) return false;
            const isSoles = (d.currency === 'SOLES' || d.currency === 'PEN');
            const isDollars = (d.currency === 'USD' || d.currency === 'DOLARES');
            const systemTotal = d.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
            const isBalanced = Math.abs(systemTotal - d.total_amount) < 0.05;
            return (isSoles || isDollars) && isBalanced;
        }).length
    };

    const filteredBatch = xmlBatch.filter(doc => {
        if (filter === 'ALL') return true;
        if (filter === 'SUCCESS') return doc.status === 'SUCCESS';
        if (filter === 'ERROR') return doc.status === 'ERROR' && !isDuplicate(doc);
        if (filter === 'DUPLICATE') return isDuplicate(doc);
        if (filter === 'PENDING') return !doc.status;
        return true;
    });

    const handleXMLConfirm = async (doc) => {
        setLoading(true);
        try {
            // Ya no realizamos la importación aquí según el nuevo flujo manual.
            // Simplemente actualizamos los datos del documento en la cola local (Batch)
            // y limpiamos el mensaje de error anterior para permitir que sea re-procesado.
            setXmlBatch(prev => prev.map(item => {
                if (item.document_number === doc.document_number) {
                    return {
                        ...doc,
                        status: null, // Volver a PENDIENTE para que runBulkProcess lo tome
                        errorMsg: null
                    };
                }
                return item;
            }));
            
            showNotification("Cambios guardados. El documento está listo para ser procesado masivamente.", 'success');
            setSelectedXmlForReview(null);
        } catch (err) {
            console.error("Error al guardar cambios del XML:", err);
            showNotification("Error al guardar las modificaciones.", 'error');
        } finally {
            setLoading(false);
        }
    };

    const runBulkProcess = async () => {
        const processable = xmlBatch.filter(doc => {
            if (doc.status === 'SUCCESS') return false; // Ya procesado
            if (isDuplicate(doc)) return false; // Omitir duplicados definidos por el sistema
            
            const isSoles = (doc.currency === 'SOLES' || doc.currency === 'PEN');
            const isDollars = (doc.currency === 'USD' || doc.currency === 'DOLARES');
            const systemTotal = doc.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
            const isBalanced = Math.abs(systemTotal - doc.total_amount) < 0.05;
            
            return (isSoles || isDollars) && isBalanced;
        });

        if (processable.length === 0) {
            showNotification("No hay documentos pendientes con cuadre válido.", 'warning');
            return;
        }

        if (window.confirm(`Se procesarán ${processable.length} documentos. ¿Desea continuar?`)) {
            setIsBulkProcessing(true);
            setTotalToProcess(processable.length);
            setCurrentProcessing(0);
            
            let createdCount = 0;
            let skipCount = 0;

            const updatedBatch = [...xmlBatch];

            for (let i = 0; i < updatedBatch.length; i++) {
                const doc = updatedBatch[i];
                if (!processable.find(p => p.document_number === doc.document_number)) continue;

                setCurrentProcessing(prev => prev + 1);
                
                try {
                    if (importType === 'SALES') {
                        await salesService.importInvoiceXml(doc, true, doc.exchange_rate);
                    } else {
                        await purchasingService.importInvoiceXml(doc, true, doc.exchange_rate);
                    }
                    updatedBatch[i].status = 'SUCCESS';
                    updatedBatch[i].errorMsg = null;
                    createdCount++;
                } catch (err) {
                    skipCount++;
                    updatedBatch[i].status = 'ERROR';
                    // Extraer mensaje detallado del servidor (FastAPI usa 'detail')
                    updatedBatch[i].errorMsg = err.response?.data?.detail || err.response?.data?.message || err.message;
                }
                setXmlBatch([...updatedBatch]);
            }
            
            setLastProcessedCount({ 
                created: createdCount, 
                skipped: skipCount, 
                pending: updatedBatch.filter(d => !d.status).length 
            });
            setIsBulkProcessing(false);
            if (createdCount > 0 || skipCount > 0) {
                setShowSuccessModal(true);
            }
        }
    };

    return (
        <Layout>
            <LoadingOverlay 
                visible={isBulkProcessing} 
                message="Importando Comprobantes..."
                subMessage={`Procesando documento ${currentProcessing} de ${totalToProcess}. Por favor espere.`}
            />
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
                <div style={{ marginBottom: '2rem', borderBottom: '1px solid #1e293b', paddingBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ color: 'white', marginBottom: '0.4rem', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <FileText size={32} color="#10b981" />
                            Importador de Facturas XML (SUNAT)
                        </h1>
                        <p style={{ color: '#64748b', margin: 0 }}>
                            Carga masiva de comprobantes electrónicos para sincronizar ventas y compras sin digitación manual.
                        </p>
                    </div>
                    
                    <div style={{ display: 'flex', background: '#0f172a', padding: '0.3rem', borderRadius: '0.75rem', border: '1px solid #334155' }}>
                        <button 
                            onClick={() => { setImportType('SALES'); setXmlBatch([]); }}
                            style={{ 
                                padding: '0.6rem 1.25rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
                                background: importType === 'SALES' ? '#10b981' : 'transparent',
                                color: importType === 'SALES' ? '#064e3b' : '#94a3b8',
                                fontWeight: 'bold', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}
                        >
                            <ShoppingCart size={18} /> VENTAS (Emitidas)
                        </button>
                        <button 
                            onClick={() => { setImportType('PURCHASE'); setXmlBatch([]); }}
                            style={{ 
                                padding: '0.6rem 1.25rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
                                background: importType === 'PURCHASE' ? '#3b82f6' : 'transparent',
                                color: importType === 'PURCHASE' ? '#eff6ff' : '#94a3b8',
                                fontWeight: 'bold', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}
                        >
                            <Tag size={18} /> COMPRAS (Recibidas)
                        </button>
                    </div>
                </div>

                {xmlBatch.length === 0 ? (
                    <div style={{ 
                        background: '#1e293b', border: '2px dashed #334155', borderRadius: '1.5rem', padding: '5rem 2rem', textAlign: 'center',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem'
                    }}>
                        <div style={{ width: '80px', height: '80px', background: '#0f172a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Upload size={40} color={importType === 'SALES' ? '#10b981' : '#3b82f6'} />
                        </div>
                        <div>
                            <h2 style={{ color: 'white', margin: '0 0 0.5rem' }}>Comience la Importación</h2>
                            <p style={{ color: '#64748b', maxWidth: '500px' }}>
                                Seleccione uno o varios archivos XML descargados del portal de SUNAT o de su OSE. El sistema validará montos, saldos e inventario.
                            </p>
                        </div>
                        <Button 
                            variant="primary" 
                            size="large" 
                            onClick={() => setShowXMLImportModal(true)}
                            style={{ background: importType === 'SALES' ? '#10b981' : '#3b82f6', color: 'white', padding: '1rem 3rem', fontSize: '1.1rem' }}
                        >
                            Seleccionar Archivos XML
                        </Button>
                    </div>
                ) : (
                    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: '#0f172a', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #1e293b' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button 
                                    onClick={() => setFilter('ALL')}
                                    style={{ 
                                        padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer',
                                        background: filter === 'ALL' ? '#334155' : 'transparent',
                                        color: filter === 'ALL' ? 'white' : '#64748b',
                                        fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s'
                                    }}
                                >
                                    Todos ({counts.all})
                                </button>
                                <button 
                                    onClick={() => setFilter('PENDING')}
                                    style={{ 
                                        padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer',
                                        background: filter === 'PENDING' ? '#334155' : 'transparent',
                                        color: filter === 'PENDING' ? '#3b82f6' : '#64748b',
                                        fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s'
                                    }}
                                >
                                    Pendientes ({counts.pending})
                                </button>
                                <button 
                                    onClick={() => setFilter('SUCCESS')}
                                    style={{ 
                                        padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer',
                                        background: filter === 'SUCCESS' ? '#064e3b' : 'transparent',
                                        color: filter === 'SUCCESS' ? '#10b981' : '#64748b',
                                        fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s'
                                    }}
                                >
                                    Procesados ({counts.success})
                                </button>
                                <button 
                                    onClick={() => setFilter('ERROR')}
                                    style={{ 
                                        padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer',
                                        background: filter === 'ERROR' ? '#450a0a' : 'transparent',
                                        color: filter === 'ERROR' ? '#f87171' : '#64748b',
                                        fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s'
                                    }}
                                >
                                    Errores ({counts.error})
                                </button>
                                <button 
                                    onClick={() => setFilter('DUPLICATE')}
                                    style={{ 
                                        padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer',
                                        background: filter === 'DUPLICATE' ? '#2e1065' : 'transparent',
                                        color: filter === 'DUPLICATE' ? '#a78bfa' : '#64748b',
                                        fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s'
                                    }}
                                >
                                    Duplicados ({counts.duplicate})
                                </button>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                {counts.success > 0 && (
                                    <Button 
                                        variant="secondary" 
                                        size="small" 
                                        onClick={() => {
                                            if (window.confirm(`¿Deseas remover de la vista los ${counts.success} documentos ya procesados?`)) {
                                                setXmlBatch(prev => prev.filter(d => d.status !== 'SUCCESS'));
                                            }
                                        }}
                                        style={{ color: '#10b981', borderColor: '#10b98144' }}
                                    >
                                        🧹 Borrar Procesados ({counts.success})
                                    </Button>
                                )}
                                <Button 
                                    variant="secondary" 
                                    size="small" 
                                    onClick={() => {
                                        if (window.confirm("¿Estás seguro de limpiar TODA la lista actual? Se perderán los documentos no procesados.")) {
                                            setXmlBatch([]); 
                                            setFilter('ALL');
                                        }
                                    }}
                                >
                                    Vaciar Todo
                                </Button>
                                <Button 
                                    variant="primary" 
                                    size="small"
                                    onClick={runBulkProcess}
                                    style={{ background: '#10b981' }}
                                    disabled={counts.reprocessable === 0}
                                >
                                    🚀 Procesar Pendientes ({counts.reprocessable})
                                </Button>
                                <Button variant="primary" size="small" onClick={() => setShowXMLImportModal(true)}>+ Agregar más</Button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                            {filteredBatch.length === 0 ? (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: '#64748b', background: '#0f172a', borderRadius: '1rem', border: '1px dashed #334155' }}>
                                    No se encontraron documentos con este filtro.
                                </div>
                            ) : filteredBatch.map((doc, idx) => {
                                const systemTotal = doc.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
                                const isBalanced = Math.abs(systemTotal - doc.total_amount) < 0.05;
                                                 return (
                                     <div key={idx} style={{
                                         background: '#1e293b', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #334155',
                                         display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden',
                                         opacity: doc.status === 'SUCCESS' ? 0.6 : 1
                                     }}>
                                         <div style={{ 
                                             position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', 
                                             background: doc.status === 'SUCCESS' ? '#10b981' : (doc.status === 'ERROR' ? '#ef4444' : (isBalanced ? '#10b981' : '#f59e0b')) 
                                         }} />
                                         
                                         <div style={{ flex: 1 }}>
                                             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                 <span style={{ fontWeight: 'bold', color: 'white', fontSize: '1.1rem' }}>{doc.document_number}</span>
                                                 {!isBalanced && <span style={{ background: '#78350f', color: '#fbbf24', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>DESCUADRADO</span>}
                                                 {doc.status === 'SUCCESS' && <CheckCircle size={16} color="#10b981" />}
                                                 {doc.status === 'ERROR' && <AlertCircle size={16} color="#ef4444" />}
                                             </div>
                                             <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                                                 {importType === 'SALES' ? doc.customer.name : (doc.supplier?.name || doc.emitter_identity)}
                                             </div>
                                             
                                             {doc.errorMsg && (
                                                 <div style={{ color: '#f87171', fontSize: '0.75rem', marginBottom: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.4rem', borderRadius: '0.4rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                                     {doc.errorMsg}
                                                 </div>
                                             )}

                                             <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                 <div style={{ 
                                                     background: doc.currency === 'USD' || doc.currency === 'DOLARES' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                     color: doc.currency === 'USD' || doc.currency === 'DOLARES' ? '#60a5fa' : '#34d399',
                                                     padding: '0.2rem 0.6rem',
                                                     borderRadius: '0.5rem',
                                                     fontSize: '0.75rem',
                                                     fontWeight: 'bold',
                                                     border: `1px solid ${doc.currency === 'USD' || doc.currency === 'DOLARES' ? '#3b82f633' : '#10b98133'}`
                                                 }}>
                                                     {doc.currency === 'USD' || doc.currency === 'DOLARES' ? '$ USD' : 'S/ PEN'}
                                                 </div>
                                                 <span style={{ 
                                                     color: doc.currency === 'USD' || doc.currency === 'DOLARES' ? '#60a5fa' : '#10b981', 
                                                     fontWeight: 'bold',
                                                     fontSize: '1.2rem'
                                                 }}>
                                                     {formatCurrency(doc.total_amount, doc.currency === 'USD' || doc.currency === 'DOLARES' ? '$' : 'S/')}
                                                 </span>
                                             </div>
                                         </div>
 
                                         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: '1rem' }}>
                                             {doc.status !== 'SUCCESS' && (
                                                 <>
                                                     <Button size="small" variant="primary" onClick={() => setSelectedXmlForReview(doc)}>Revisar</Button>
                                                     <button 
                                                         onClick={() => setXmlBatch(prev => prev.filter(d => d.document_number !== doc.document_number))}
                                                         style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.75rem' }}
                                                     >
                                                         Remover
                                                     </button>
                                                 </>
                                             )}
                                             {doc.status === 'SUCCESS' && (
                                                 <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 'bold' }}>PROCESADO</span>
                                             )}
                                         </div>
                                     </div>
                                 );
                            })}
                        </div>
                    </div>
                )}

                <XMLImportModal 
                    visible={showXMLImportModal} 
                    onClose={() => setShowXMLImportModal(false)} 
                    type={importType === 'SALES' ? 'SALES' : 'PURCHASE'}
                    onConfirm={(batch) => {
                        setXmlBatch(prev => [...prev, ...batch]);
                        setShowXMLImportModal(false);
                    }}
                />

                {selectedXmlForReview && (
                    <XMLReviewModal 
                        visible={!!selectedXmlForReview}
                        doc={selectedXmlForReview}
                        onClose={() => setSelectedXmlForReview(null)}
                        loading={loading}
                        onConfirm={handleXMLConfirm}
                    />
                )}

                {/* Progress Overlay */}
                {isBulkProcessing && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 5000, backdropFilter: 'blur(10px)' }}>
                        <Rocket size={64} color="#10b981" style={{ animation: 'bounce 1s infinite', marginBottom: '2rem' }} />
                        <h2 style={{ color: 'white', marginBottom: '0.5rem' }}>Procesando Documentos...</h2>
                        <p style={{ color: '#94a3b8' }}>Documento {currentProcessing} de {totalToProcess}</p>
                        <div style={{ marginTop: '2rem', width: '300px', height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${(currentProcessing / totalToProcess) * 100}%`, height: '100%', background: '#10b981', transition: 'width 0.3s' }} />
                        </div>
                    </div>
                )}

                {/* Success Modal (World-Class Summary) */}
                {showSuccessModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6000, backdropFilter: 'blur(8px)' }}>
                        <div style={{ background: '#1e293b', padding: '2.5rem', borderRadius: '2rem', textAlign: 'center', maxWidth: '600px', width: '90%', border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                            <div style={{ width: '80px', height: '80px', background: '#10b98122', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <CheckCircle size={48} color="#10b981" />
                            </div>
                            <h2 style={{ color: 'white', fontSize: '1.8rem', marginBottom: '0.5rem' }}>Proceso Finalizado</h2>
                            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Se ha completado la importación masiva de comprobantes.</p>
                            
                            <div style={{ background: '#0f172a', borderRadius: '1.25rem', overflow: 'hidden', border: '1px solid #334155', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', borderBottom: '1px solid #334155' }}>
                                    <div style={{ flex: 1, padding: '1rem', borderRight: '1px solid #334155' }}>
                                        <div style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: 'bold' }}>{lastProcessedCount.created}</div>
                                        <div style={{ color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase' }}>Importados</div>
                                    </div>
                                    <div style={{ flex: 1, padding: '1rem' }}>
                                        <div style={{ color: '#ef4444', fontSize: '1.5rem', fontWeight: 'bold' }}>{lastProcessedCount.skipped}</div>
                                        <div style={{ color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase' }}>Con Errores</div>
                                    </div>
                                </div>
                                
                                <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '1rem', textAlign: 'left' }}>
                                    {xmlBatch.filter(d => d.status === 'SUCCESS' || d.status === 'ERROR').slice(-10).map((d, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: i === 9 ? 'none' : '1px solid #1e293b', fontSize: '0.85rem' }}>
                                            <div style={{ color: '#e2e8f0' }}>
                                                <span style={{ fontWeight: 'bold', marginRight: '8px' }}>{d.document_number}</span>
                                                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{d.supplier?.name || d.customer?.name}</span>
                                            </div>
                                            <span style={{ 
                                                color: d.status === 'SUCCESS' ? '#10b981' : '#ef4444',
                                                fontWeight: 'bold',
                                                fontSize: '0.75rem'
                                            }}>
                                                {d.status === 'SUCCESS' ? '✓ OK' : '✕ ERROR'}
                                            </span>
                                        </div>
                                    ))}
                                    {xmlBatch.filter(d => d.status === 'SUCCESS' || d.status === 'ERROR').length > 10 && (
                                        <div style={{ textAlign: 'center', color: '#475569', fontSize: '0.75rem', marginTop: '0.5rem' }}>... y otros documentos más</div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <Button 
                                    variant="secondary" 
                                    size="large" 
                                    onClick={() => {
                                        setXmlBatch(prev => prev.filter(d => d.status !== 'SUCCESS'));
                                        setShowSuccessModal(false);
                                    }} 
                                    style={{ flex: 1 }}
                                >
                                    Limpiar Éxitos
                                </Button>
                                <Button 
                                    variant="primary" 
                                    size="large" 
                                    onClick={() => setShowSuccessModal(false)} 
                                    style={{ flex: 1, background: '#10b981' }}
                                >
                                    Cerrar
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                <style>{`
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
                `}</style>
            </div>
        </Layout>
    );
};

export default BulkXMLImport;
