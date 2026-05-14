import React, { useState, useEffect } from 'react';
import { 
    Search, Trash2, CheckCircle, Clock, Info, Database, 
    RefreshCcw, ShieldCheck, Zap, BookOpen, Upload, Rocket, FileText, AlertCircle
} from 'lucide-react';
import { salesService, purchasingService, intelligenceService, productBrandService } from '../services/api';
import { useSalesInvoices } from '../hooks/useSalesInvoices';
import { usePurchaseInvoices } from '../hooks/usePurchaseInvoices';
import { useNotification } from '../hooks/useNotification';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Pagination from '../components/common/Table/Pagination';
import Loading from '../components/common/Loading';
import XMLImportModal from '../components/common/XMLImportModal';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useLoading } from '../context/LoadingContext';

const FinancialSincerityInbox = () => {
    const { showNotification } = useNotification();
    const { showLoading, hideLoading } = useLoading();

    const [activeTab, setActiveTab] = useState('ingest'); 
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);

    // Ingest Queue State
    const [ingestQueue, setIngestQueue] = useState([]);
    const [loadingIngest, setLoadingIngest] = useState(false);
    const [ingestFilter, setIngestFilter] = useState('ALL');
    const [showImportModal, setShowImportModal] = useState(false);
    const [ingestSummary, setIngestSummary] = useState(null); // array of results

    // Catalog Specific State
    const [unmappedItems, setUnmappedItems] = useState([]);
    const [loadingCatalog, setLoadingCatalog] = useState(false);
    const [mappingModal, setMappingModal] = useState(null); // { item }
    const [mappingValue, setMappingValue] = useState('');

    // Master Data Specific State
    const [masterGaps, setMasterGaps] = useState({ unknown_customers: [], missing_exchange_rates: [] });
    const [loadingMaster, setLoadingMaster] = useState(false);
    const [masterModal, setMasterModal] = useState(null); // { type: 'customer'|'rate', data }
    const [masterValue, setMasterValue] = useState('');
    const [selectedMasterRucs, setSelectedMasterRucs] = useState([]);

    // Logistics Specific State
    const [pendingLogistics, setPendingLogistics] = useState([]);
    const [loadingLogistics, setLoadingLogistics] = useState(false);
    const [showGuideImportModal, setShowGuideImportModal] = useState(false);

    useEffect(() => {
        // Al entrar, cargamos TODO para tener los badges actualizados
        fetchIngestQueue();
        fetchUnmappedItems();
        fetchMasterGaps();
        fetchPendingLogistics();
    }, []);

    useEffect(() => {
        setPage(1);
        setSelectedIds([]);
        // Recargar el contenido específico de la pestaña activa si es necesario
        if (activeTab === 'ingest') fetchIngestQueue();
        if (activeTab === 'catalog') fetchUnmappedItems();
        if (activeTab === 'master') fetchMasterGaps();
        if (activeTab === 'logistics') fetchPendingLogistics();
    }, [activeTab]);

    const fetchIngestQueue = async () => {
        setLoadingIngest(true);
        try {
            const res = await intelligenceService.getIngestQueue();
            setIngestQueue(res.data);
        } catch (error) {
            showNotification('Error al cargar cola de ingesta', 'error');
        } finally {
            setLoadingIngest(false);
        }
    };

    const fetchUnmappedItems = async () => {
        setLoadingCatalog(true);
        try {
            const res = await intelligenceService.getUnmappedCatalogItems();
            setUnmappedItems(res.data);
        } catch (error) {
            showNotification('Error al cargar items no mapeados', 'error');
        } finally {
            setLoadingCatalog(false);
        }
    };

    const fetchMasterGaps = async () => {
        setLoadingMaster(true);
        try {
            const res = await intelligenceService.getMasterGaps();
            setMasterGaps(res.data);
        } catch (error) {
            showNotification('Error al cargar brechas de maestros', 'error');
        } finally {
            setLoadingMaster(false);
        }
    };

    // Data hooks for Finance Tabs
    const salesData = useSalesInvoices({ 
        page, 
        limit, 
        search, 
        is_confirmed: false 
    });

    const purchaseData = usePurchaseInvoices({ 
        page, 
        limit, 
        search, 
        is_confirmed: false 
    });

    const currentData = activeTab === 'sales' ? salesData : purchaseData;
    const { invoices, pagination, loading, fetchInvoices, deleteInvoice } = currentData || { invoices: [], pagination: {} };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(invoices.map(inv => inv.invoice_number));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (invoiceNumber) => {
        setSelectedIds(prev => 
            prev.includes(invoiceNumber) 
                ? prev.filter(id => id !== invoiceNumber)
                : [...prev, invoiceNumber]
        );
    };

    const handleBulkSincerity = async (condition) => {
        if (selectedIds.length === 0) return;

        // Validar integridad
        const selectedInvoices = invoices.filter(inv => selectedIds.includes(inv.invoice_number));
        const incomplete = selectedInvoices.find(inv => !inv.is_catalog_confirmed || !inv.is_customer_confirmed || !inv.is_exchange_rate_confirmed);
        
        if (incomplete) {
            showNotification(`La factura ${incomplete.sunat_number} tiene brechas de integridad. Resuélvelas en las pestañas de Catálogo o Maestros.`, 'warning');
            return;
        }

        const label = condition === 'CONTADO' ? 'CONTADO (Pagado)' : 'CRÉDITO (Por Pagar/Cobrar)';
        if (!window.confirm(`¿Desea sincerar ${selectedIds.length} facturas como ${label}?`)) return;

        try {
            const service = activeTab === 'sales' ? salesService : purchasingService;
            await service.bulkUpdatePaymentCondition({
                invoice_numbers: selectedIds,
                condition
            });
            showNotification(`Se sinceraron ${selectedIds.length} facturas correctamente`, 'success');
            setSelectedIds([]);
            fetchInvoices();
        } catch (error) {
            showNotification('Error al sincerar facturas', 'error');
        }
    };

    const handleDelete = async (invoiceNumber) => {
        if (!window.confirm('¿Está seguro de eliminar esta factura importada?')) return;
        try {
            await deleteInvoice(invoiceNumber);
            showNotification('Factura eliminada', 'success');
        } catch (error) {}
    };

    const handleResolveMapping = async (externalCode, brand, internalSku) => {
        try {
            await intelligenceService.resolveCatalogMapping({
                external_code: externalCode,
                brand,
                internal_sku: internalSku,
                create_alias: true
            });
            showNotification(`Código ${externalCode} vinculado exitosamente`, 'success');
            fetchUnmappedItems();
            setMappingModal(null);
        } catch (error) {
            showNotification('Error al vincular código', 'error');
        }
    };

    const handleResolveRate = async (date, rate) => {
        try {
            await intelligenceService.resolveRateSincerity({ date, sale_rate: parseFloat(rate) });
            showNotification(`Tipo de Cambio para ${date} establecido`, 'success');
            fetchMasterGaps();
            setMasterModal(null);
        } catch (error) {
            showNotification('Error al establecer tipo de cambio', 'error');
        }
    };

    const handleResolveCustomer = async (ruc, customerId) => {
        try {
            await intelligenceService.resolveCustomerSincerity({ ruc, customer_id: customerId });
            showNotification(`RUC ${ruc} vinculado exitosamente`, 'success');
            fetchMasterGaps();
            setMasterModal(null);
        } catch (error) {
            showNotification('Error al vincular cliente', 'error');
        }
    };

    const handleAutoCreateCustomer = async (ruc, name) => {
        try {
            showLoading();
            await intelligenceService.autoCreateCustomerFromGap({ ruc, name });
            showNotification(`Cliente ${name} creado y facturas sinceradas`, 'success');
            fetchMasterGaps();
            fetchIngestQueue();
            setMasterModal(null);
            setSelectedMasterRucs([]);
        } catch (error) {
            showNotification('Error al crear cliente automáticamente', 'error');
        } finally {
            hideLoading();
        }
    };

    const handleBulkAutoCreateCustomers = async (list = null) => {
        const customersToProcess = list || masterGaps.unknown_customers.filter(c => selectedMasterRucs.includes(c.ruc));
        if (customersToProcess.length === 0) return;
        
        try {
            showLoading();
            const res = await intelligenceService.bulkAutoCreateCustomers(customersToProcess.map(c => ({ ruc: c.ruc, name: c.name })));
            showNotification(`${res.created} clientes registrados. ${res.invoices_sincerated} facturas sinceradas.`, 'success');
            fetchMasterGaps();
            fetchIngestQueue();
            setSelectedMasterRucs([]);
        } catch (error) {
            showNotification('Error en proceso masivo de clientes', 'error');
        } finally {
            hideLoading();
        }
    };

    const fetchPendingLogistics = async () => {
        setLoadingLogistics(true);
        try {
            const res = await intelligenceService.getPendingLogistics();
            setPendingLogistics(res.data);
        } catch (error) {
            showNotification('Error al cargar pendientes de logística', 'error');
        } finally {
            setLoadingLogistics(false);
        }
    };

    const handleBulkGenerateGuides = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`¿Desea generar guías internas automáticas para ${selectedIds.length} facturas?`)) return;

        showLoading("Generando Guías...", "Esto moverá stock y registrará documentos internos.");
        try {
            // Find full invoice objects to get their Mongo IDs
            const invoicesToProcess = pendingLogistics.filter(inv => selectedIds.includes(inv.invoice_number));
            const ids = invoicesToProcess.map(inv => inv._id);

            await intelligenceService.bulkGenerateGuides({ invoice_ids: ids });
            showNotification(`Se generaron ${selectedIds.length} guías exitosamente`, 'success');
            setSelectedIds([]);
            fetchPendingLogistics();
        } catch (error) {
            showNotification('Error al generar guías masivas', 'error');
        } finally {
            hideLoading();
        }
    };

    const handleMatchXMLGuides = async (batch) => {
        try {
            showLoading("Vinculando Guías XML...", "Validando integridad con facturas existentes.");
            await intelligenceService.matchXMLGuides(batch);
            showNotification("Guías vinculadas correctamente", 'success');
            fetchPendingLogistics();
            setShowGuideImportModal(false);
        } catch (error) {
            showNotification("Error al vincular guías", 'error');
        } finally {
            hideLoading();
        }
    };

    const handleRevertLogistics = async (invoiceId) => {
        if (!window.confirm("¿Está seguro de revertir la logística de esta factura? Se anulará la guía vinculada.")) return;
        try {
            await intelligenceService.revertLogistics(invoiceId);
            showNotification("Logística revertida", 'success');
            fetchPendingLogistics();
        } catch (error) {
            showNotification("Error al revertir logística", 'error');
        }
    };

    const handleIngestBatch = async (batch) => {
        try {
            showLoading("Analizando XMLs...", "Preparando documentos para la cola persistente.");
            await intelligenceService.addToIngestQueue(batch);
            showNotification("Documentos agregados a la cola soberana", 'success');
            fetchIngestQueue();
            setShowImportModal(false);
        } catch (error) {
            showNotification("Error al agregar a la cola", 'error');
        } finally {
            hideLoading();
        }
    };

    const runBulkIngestProcess = async () => {
        const processable = ingestQueue.filter(doc => {
            const msg = doc.errorMsg?.toLowerCase() || "";
            const isDuplicate = msg.includes('ya existe') || msg.includes('duplicado');
            if (doc.status === 'SUCCESS' || isDuplicate) return false;
            return true;
        });

        if (processable.length === 0) {
            showNotification("No hay documentos válidos en la cola", 'warning');
            return;
        }

        if (!window.confirm(`Se procesarán ${processable.length} documentos. ¿Continuar?`)) return;

        showLoading("Procesando Ingesta...", "Inyectando documentos en el pipeline de sinceramiento.");
        
        const results = [];
        let successCount = 0;

        for (const item of processable) {
            try {
                const res = await intelligenceService.processIngestItem(item.ingest_id);
                results.push({
                    ...res.data,
                    original_id: item.ingest_id,
                    success: true
                });
                successCount++;
            } catch (err) {
                results.push({
                    document_number: item.document_number,
                    message: err.response?.data?.detail || err.message || "Error desconocido",
                    success: false
                });
            }
        }

        hideLoading();
        setIngestSummary(results);
        fetchIngestQueue();
        
        if (successCount > 0) {
            showNotification(`Se procesaron ${successCount} documentos con éxito`, 'success');
        }
    };

    // Sub-componentes de Pestañas
    const MasterDataTabContent = () => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div style={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: '1px solid #334155', overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem', borderBottom: '1px solid #334155', background: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <BookOpen size={20} color="#3b82f6" />
                        <span style={{ color: 'white', fontWeight: '700' }}>Clientes Nuevos (RUCs Desconocidos)</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {selectedMasterRucs.length > 0 && (
                            <Button size="sm" variant="success" onClick={() => handleBulkAutoCreateCustomers()}>Registrar ({selectedMasterRucs.length})</Button>
                        )}
                        <Button size="sm" variant="primary" onClick={() => handleBulkAutoCreateCustomers(masterGaps.unknown_customers)} disabled={masterGaps.unknown_customers.length === 0}>Registrar Todo</Button>
                    </div>
                </div>
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#0f172a' }}>
                                <th style={{ padding: '1rem', width: '40px' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedMasterRucs.length === masterGaps.unknown_customers.length && masterGaps.unknown_customers.length > 0}
                                        onChange={(e) => setSelectedMasterRucs(e.target.checked ? masterGaps.unknown_customers.map(c => c.ruc) : [])}
                                    />
                                </th>
                                <th style={{ padding: '1rem', color: '#64748b', fontSize: '0.75rem', textAlign: 'left' }}>RUC / RAZÓN SOCIAL</th>
                                <th style={{ padding: '1rem', color: '#64748b', fontSize: '0.75rem', textAlign: 'center' }}>FACTS</th>
                                <th style={{ padding: '1rem', color: '#64748b', fontSize: '0.75rem', textAlign: 'right' }}>ACCIÓN</th>
                            </tr>
                        </thead>
                        <tbody>
                            {masterGaps.unknown_customers.length === 0 ? (
                                <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#475569' }}>Todos los clientes están registrados.</td></tr>
                            ) : (
                                masterGaps.unknown_customers.map((c, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={selectedMasterRucs.includes(c.ruc)}
                                                onChange={() => setSelectedMasterRucs(prev => prev.includes(c.ruc) ? prev.filter(r => r !== c.ruc) : [...prev, c.ruc])}
                                            />
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ color: 'white', fontWeight: '600' }}>{c.ruc}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{c.name}</div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', color: '#3b82f6' }}>{c.occurrences}</td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <Button size="sm" variant="success" icon={Zap} onClick={() => handleAutoCreateCustomer(c.ruc, c.name)}>Registrar</Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: '1px solid #334155', overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem', borderBottom: '1px solid #334155', background: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <RefreshCcw size={20} color="#f59e0b" />
                    <span style={{ color: 'white', fontWeight: '700' }}>Tipos de Cambio Pendientes</span>
                </div>
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#0f172a' }}>
                                <th style={{ padding: '1rem', color: '#64748b', fontSize: '0.75rem', textAlign: 'left' }}>FECHA DEL DOCUMENTO</th>
                                <th style={{ padding: '1rem', color: '#64748b', fontSize: '0.75rem', textAlign: 'center' }}>FACTS</th>
                                <th style={{ padding: '1rem', color: '#64748b', fontSize: '0.75rem', textAlign: 'right' }}>ACCIÓN</th>
                            </tr>
                        </thead>
                        <tbody>
                            {masterGaps.missing_exchange_rates.length === 0 ? (
                                <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: '#475569' }}>No hay brechas de Tipo de Cambio.</td></tr>
                            ) : (
                                masterGaps.missing_exchange_rates.map((r, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ color: 'white', fontWeight: '600' }}>{r.date}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>TC Actual: {r.current_placeholder} (Placeholder)</div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', color: '#3b82f6' }}>{r.occurrences}</td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <Button size="sm" variant="warning" onClick={() => setMasterModal({ type: 'rate', data: r })}>Definir TC</Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const IngestTabContent = () => (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', background: '#1e293b', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {['ALL', 'ERROR'].map(f => (
                            <Button 
                                key={f}
                                variant={ingestFilter === f ? 'primary' : 'ghost'}
                                size="small"
                                onClick={() => setIngestFilter(f)}
                            >
                                {f === 'ALL' ? 'Pendientes' : 'Con Errores'}
                            </Button>
                        ))}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="secondary" onClick={() => intelligenceService.clearIngestQueue().then(fetchIngestQueue)}>Vaciar Cola</Button>
                    <Button variant="primary" icon={Rocket} onClick={runBulkIngestProcess} disabled={ingestQueue.length === 0}>Iniciar Ingesta ({ingestQueue.length})</Button>
                    <Button variant="glass" icon={Upload} onClick={() => setShowImportModal(true)}>Cargar XMLs</Button>
                </div>
            </div>

            {ingestQueue.length === 0 ? (
                <div style={{ background: '#0f172a', border: '2px dashed #1e293b', borderRadius: '2rem', padding: '6rem 2rem', textAlign: 'center' }}>
                    <Upload size={48} color="#3b82f6" style={{ marginBottom: '1.5rem' }} />
                    <h2 style={{ color: 'white' }}>Cola de Ingesta Vacía</h2>
                    <p style={{ color: '#64748b', marginBottom: '2rem' }}>Cargue archivos XML para iniciar el pipeline de sinceramiento.</p>
                    <Button variant="primary" onClick={() => setShowImportModal(true)}>Cargar Documentos</Button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem' }}>
                    {ingestQueue.filter(q => ingestFilter === 'ALL' ? true : q.ingest_status === 'ERROR').map((doc, idx) => (
                        <div key={idx} style={{ 
                            background: '#0f172a', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid #334155',
                            borderLeft: `6px solid ${doc.ingest_status === 'ERROR' ? '#ef4444' : '#3b82f6'}`,
                            boxShadow: doc.ingest_status === 'ERROR' ? '0 0 15px rgba(239, 68, 68, 0.1)' : 'none'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ color: 'white', fontWeight: '800' }}>{doc.document_number}</div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{formatDate(doc.persistent_created_at || doc.invoice_date)}</div>
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>{doc.supplier?.name || doc.issuer_name || 'Entidad Detectada'}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ color: 'white', fontWeight: 'bold' }}>{formatCurrency(doc.total_amount || doc.total, doc.currency === 'USD' ? '$' : 'S/')}</div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {doc.ingest_status === 'ERROR' ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#ef4444' }}>
                                            <AlertCircle size={14} />
                                            <span style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>ERROR</span>
                                        </div>
                                    ) : (
                                        <span style={{ fontSize: '0.65rem', color: '#3b82f6', fontWeight: 'bold' }}>PENDIENTE</span>
                                    )}
                                </div>
                            </div>
                            {doc.ingest_status === 'ERROR' && (
                                <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: '0.75rem', border: '1px solid rgba(239, 68, 68, 0.1)', color: '#fca5a5', fontSize: '0.75rem' }}>
                                    <strong>Motivo:</strong> {doc.error_msg}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const CatalogTabContent = () => (
        <div style={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: '1px solid #334155', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Zap size={20} color="#f59e0b" />
                    <span style={{ color: 'white', fontWeight: '700', fontSize: '1.1rem' }}>Items en Incubación (Sin SKU)</span>
                </div>
                <Button variant="outline" onClick={fetchUnmappedItems} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><RefreshCcw size={16} /> Actualizar</Button>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#1e293b' }}>
                            <th style={{ padding: '1.25rem 1rem', color: '#94a3b8', fontSize: '0.85rem' }}>Código XML</th>
                            <th style={{ padding: '1.25rem 1rem', color: '#94a3b8', fontSize: '0.85rem' }}>Frecuencia</th>
                            <th style={{ padding: '1.25rem 1rem', color: '#94a3b8', fontSize: '0.85rem' }}>Sugerencias Inteligentes</th>
                            <th style={{ padding: '1.25rem 1rem', color: '#94a3b8', fontSize: '0.85rem' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loadingCatalog ? (
                            <tr><td colSpan="4" style={{ padding: '4rem', textAlign: 'center' }}><Loading /></td></tr>
                        ) : unmappedItems.length === 0 ? (
                            <tr><td colSpan="4" style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>No hay ítems pendientes de mapeo.</td></tr>
                        ) : (
                            unmappedItems.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                                    <td style={{ padding: '1.25rem 1rem' }}>
                                        <div style={{ color: 'white', fontWeight: 'bold' }}>{item.external_code}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.external_description}</div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem', color: '#3b82f6' }}>{item.occurrences} facts</td>
                                    <td style={{ padding: '1.25rem 1rem' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {item.suggestions.map((sug, sidx) => (
                                                <div key={sidx} onClick={() => handleResolveMapping(item.external_code, item.brand, sug.sku)} style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
                                                    <span style={{ color: 'white', fontWeight: 'bold', fontSize: '0.85rem' }}>{sug.sku}</span>
                                                    <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: '#10b981' }}>{Math.round(sug.confidence * 100)}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem' }}>
                                        <Button variant="outline" size="sm" onClick={() => setMappingModal({ item })}>Mapeo Manual</Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const LogisticsTabContent = () => (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', background: '#1e293b', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid #334155' }}>
                <div style={{ color: 'white' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>Pendientes de Vinculación Logística</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>Facturas importadas que requieren Guía de Remisión para mover stock.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="primary" icon={Rocket} onClick={handleBulkGenerateGuides} disabled={selectedIds.length === 0}>Guía Automática ({selectedIds.length})</Button>
                    <Button variant="glass" icon={Upload} onClick={() => setShowGuideImportModal(true)}>Vincular Guías SUNAT (XML)</Button>
                </div>
            </div>

            <div style={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: '1px solid #334155', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#1e293b' }}>
                            <th style={{ padding: '1rem' }}>
                                <input 
                                    type="checkbox" 
                                    onChange={(e) => setSelectedIds(e.target.checked ? pendingLogistics.map(i => i.invoice_number) : [])} 
                                    checked={selectedIds.length === pendingLogistics.length && pendingLogistics.length > 0} 
                                />
                            </th>
                            <th style={{ padding: '1rem', color: '#94a3b8', textAlign: 'left' }}>Factura</th>
                            <th style={{ padding: '1rem', color: '#94a3b8', textAlign: 'left' }}>Cliente</th>
                            <th style={{ padding: '1rem', color: '#94a3b8', textAlign: 'left' }}>Estado</th>
                            <th style={{ padding: '1rem', color: '#94a3b8', textAlign: 'right' }}>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loadingLogistics ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}><Loading /></td></tr>
                        ) : pendingLogistics.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: '#475569' }}>No hay facturas pendientes de logística.</td></tr>
                        ) : (
                            pendingLogistics.map((inv, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.includes(inv.invoice_number)} 
                                            onChange={() => handleSelectOne(inv.invoice_number)} 
                                        />
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ color: 'white', fontWeight: 'bold' }}>{inv.sunat_number}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{formatDate(inv.invoice_date)}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ color: 'white' }}>{inv.customer_name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{inv.customer_ruc}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', borderRadius: '1rem', backgroundColor: '#334155', color: '#94a3b8' }}>
                                            ESPERANDO LOGÍSTICA
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <Button variant="ghost" size="sm" color="#ef4444" icon={RefreshCcw} onClick={() => handleRevertLogistics(inv._id)}>Limpiar</Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', borderBottom: '1px solid #334155', paddingBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <ShieldCheck size={32} color="#3b82f6" /> Buzón de Sinceramiento e Integridad
                    </h1>
                    <p style={{ color: '#94a3b8' }}>Centro de Gobierno de Datos: Sinceramiento Financiero, Catálogo y Maestros</p>
                </div>
                <div style={{ backgroundColor: '#1e293b', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #334155', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>PENDIENTES</div>
                    <div style={{ fontSize: '1.5rem', color: '#3b82f6', fontWeight: 'bold' }}>{activeTab === 'catalog' ? unmappedItems.length : activeTab === 'master' ? (masterGaps.unknown_customers.length + masterGaps.missing_exchange_rates.length) : pagination.totalItems || 0}</div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <Button onClick={() => setActiveTab('ingest')} variant={activeTab === 'ingest' ? 'primary' : 'secondary'} icon={Upload}>
                    1. Ingesta {ingestQueue.length > 0 && <span style={{ marginLeft: '0.5rem', backgroundColor: '#3b82f6', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '0.5rem', fontSize: '0.7rem' }}>{ingestQueue.length}</span>}
                </Button>
                <Button onClick={() => setActiveTab('sales')} variant={activeTab === 'sales' ? 'primary' : 'secondary'} icon={() => <span>💰</span>}>
                    2. Ventas {pagination.totalItems > 0 && activeTab !== 'sales' && <span style={{ marginLeft: '0.5rem', backgroundColor: '#3b82f6', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '0.5rem', fontSize: '0.7rem' }}>{pagination.totalItems}</span>}
                </Button>
                <Button onClick={() => setActiveTab('purchasing')} variant={activeTab === 'purchasing' ? 'primary' : 'secondary'} icon={() => <span>🛒</span>}>
                    2. Compras
                </Button>
                <Button onClick={() => setActiveTab('logistics')} variant={activeTab === 'logistics' ? 'primary' : 'secondary'} icon={() => <span>🚚</span>}>
                    3. Logística {pendingLogistics.length > 0 && <span style={{ marginLeft: '0.5rem', backgroundColor: '#ef4444', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '0.5rem', fontSize: '0.7rem' }}>{pendingLogistics.length}</span>}
                </Button>
                <Button onClick={() => setActiveTab('catalog')} variant={activeTab === 'catalog' ? 'warning' : 'secondary'} icon={Database}>
                    4. Catálogo {unmappedItems.length > 0 && <span style={{ marginLeft: '0.5rem', backgroundColor: '#f59e0b', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '0.5rem', fontSize: '0.7rem' }}>{unmappedItems.length}</span>}
                </Button>
                <Button onClick={() => setActiveTab('master')} variant={activeTab === 'master' ? 'success' : 'secondary'} icon={ShieldCheck}>
                    5. Maestros {(masterGaps.unknown_customers.length + masterGaps.missing_exchange_rates.length) > 0 && <span style={{ marginLeft: '0.5rem', backgroundColor: '#10b981', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '0.5rem', fontSize: '0.7rem' }}>{masterGaps.unknown_customers.length + masterGaps.missing_exchange_rates.length}</span>}
                </Button>
            </div>

            {/* Content */}
            {activeTab === 'ingest' ? <IngestTabContent /> : 
             activeTab === 'catalog' ? <CatalogTabContent /> : 
             activeTab === 'master' ? <MasterDataTabContent /> : 
             activeTab === 'logistics' ? <LogisticsTabContent /> : (
                <div style={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: '1px solid #334155', overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ position: 'relative', width: '400px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                            <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.75rem 1rem 0.75rem 2.75rem', color: 'white' }} />
                        </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#1e293b' }}>
                                    <th style={{ padding: '1rem' }}><input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length === invoices.length && invoices.length > 0} /></th>
                                    <th style={{ padding: '1rem', color: '#94a3b8' }}>Documento</th>
                                    <th style={{ padding: '1rem', color: '#94a3b8' }}>Entidad</th>
                                    <th style={{ padding: '1rem', color: '#94a3b8' }}>Monto</th>
                                    <th style={{ padding: '1rem', color: '#94a3b8' }}>Integridad</th>
                                    <th style={{ padding: '1rem', color: '#94a3b8' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}><Loading /></td></tr> : invoices.map(inv => (
                                    <tr key={inv.invoice_number} style={{ borderBottom: '1px solid #1e293b' }}>
                                        <td style={{ padding: '1rem' }}><input type="checkbox" checked={selectedIds.includes(inv.invoice_number)} onChange={() => handleSelectOne(inv.invoice_number)} /></td>
                                        <td style={{ padding: '1rem' }}><div style={{ color: 'white', fontWeight: 'bold' }}>{inv.sunat_number}</div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>{formatDate(inv.invoice_date)}</div></td>
                                        <td style={{ padding: '1rem' }}><div style={{ color: 'white' }}>{inv.customer_name}</div><div style={{ fontSize: '0.8rem', color: '#64748b' }}>{inv.customer_ruc}</div></td>
                                        <td style={{ padding: '1rem', color: 'white', fontWeight: 'bold' }}>{formatCurrency(inv.total_amount)}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <Database size={16} color={inv.is_catalog_confirmed ? "#10b981" : "#ef4444"} />
                                                <BookOpen size={16} color={inv.is_customer_confirmed ? "#10b981" : "#ef4444"} />
                                                <RefreshCcw size={16} color={inv.is_exchange_rate_confirmed ? "#10b981" : "#ef4444"} />
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}><button onClick={() => handleDelete(inv.invoice_number)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18} /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ padding: '1.5rem' }}><Pagination current={pagination.current} total={pagination.total} onChange={setPage} pageSize={limit} onPageSizeChange={setLimit} /></div>
                </div>
            )}

            {/* Modales */}
            {mappingModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ backgroundColor: '#1e293b', padding: '2rem', borderRadius: '1rem', width: '500px', border: '1px solid #3b82f6' }}>
                        <h3 style={{ color: 'white', marginBottom: '1.5rem' }}>Mapeo Manual</h3>
                        <Input 
                            label="SKU Maestro" 
                            placeholder="Ej: PH3593A" 
                            autoFocus 
                            value={mappingValue}
                            onChange={(e) => setMappingValue(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <Button onClick={() => { setMappingModal(null); setMappingValue(''); }} variant="outline">Cancelar</Button>
                            <Button onClick={() => { handleResolveMapping(mappingModal.item.external_code, mappingModal.item.brand, mappingValue); setMappingValue(''); }}>Guardar</Button>
                        </div>
                    </div>
                </div>
            )}

            {masterModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ backgroundColor: '#1e293b', padding: '2rem', borderRadius: '1rem', width: '500px', border: '1px solid #10b981' }}>
                        <h3 style={{ color: 'white', marginBottom: '1.5rem' }}>{masterModal.type === 'customer' ? 'Vincular Cliente' : 'Definir TC'}</h3>
                        <Input 
                            label={masterModal.type === 'customer' ? 'ID del Cliente Maestro' : 'Valor TC Venta'} 
                            placeholder={masterModal.type === 'customer' ? "MongoID" : "3.755"} 
                            autoFocus 
                            value={masterValue}
                            onChange={(e) => setMasterValue(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <Button onClick={() => { setMasterModal(null); setMasterValue(''); }} variant="outline">Cancelar</Button>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {masterModal.type === 'customer' && (
                                    <Button onClick={() => handleAutoCreateCustomer(masterModal.data.ruc, masterModal.data.name)} variant="success" icon={Zap}>Alta Automática</Button>
                                )}
                                <Button onClick={() => { if (masterModal.type === 'customer') handleResolveCustomer(masterModal.data.ruc, masterValue); else handleResolveRate(masterModal.data.date, masterValue); setMasterValue(''); }}>{masterModal.type === 'customer' ? 'Vincular ID' : 'Confirmar'}</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Selection Toolbar */}
            {selectedIds.length > 0 && activeTab !== 'catalog' && activeTab !== 'master' && (
                <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#1e293b', padding: '1rem 2rem', borderRadius: '1rem', border: '1px solid #3b82f6', display: 'flex', gap: '2rem', alignItems: 'center', zIndex: 1000, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                    <span style={{ color: 'white', fontWeight: 'bold' }}>{selectedIds.length} seleccionados</span>
                    <Button variant="success" onClick={() => handleBulkSincerity('CONTADO')}>Confirmar CONTADO</Button>
                    <Button variant="warning" onClick={() => handleBulkSincerity('CREDITO')}>Confirmar CRÉDITO</Button>
                </div>
            )}
            {showImportModal && (
                <XMLImportModal 
                    visible={showImportModal} 
                    onClose={() => setShowImportModal(false)} 
                    type="UNIVERSAL"
                    onConfirm={handleIngestBatch}
                />
            )}
            {showGuideImportModal && (
                <XMLImportModal 
                    visible={showGuideImportModal} 
                    onClose={() => setShowGuideImportModal(false)} 
                    type="DELIVERY_GUIDE"
                    onConfirm={handleMatchXMLGuides}
                />
            )}

            {/* Ingestion Summary Modal */}
            {ingestSummary && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div style={{ backgroundColor: '#0f172a', borderRadius: '1.5rem', width: '100%', maxWidth: '900px', border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden', animation: 'scaleUp 0.3s ease-out' }}>
                        <div style={{ padding: '1.5rem 2rem', background: 'linear-gradient(90deg, #1e293b 0%, #0f172a 100%)', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Rocket size={24} color="#10b981" />
                                <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>Resumen de Ingesta Masiva</h2>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setIngestSummary(null)}>Cerrar</Button>
                        </div>
                        
                        <div style={{ padding: '2rem', maxHeight: '60vh', overflowY: 'auto' }}>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {ingestSummary.map((res, i) => (
                                    <div key={i} style={{ backgroundColor: '#1e293b', borderRadius: '1rem', padding: '1.25rem', border: `1px solid ${res.success ? '#334155' : '#ef4444'}` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ color: 'white', fontWeight: '800', fontSize: '1rem' }}>{res.document_number}</span>
                                                    <span style={{ 
                                                        fontSize: '0.7rem', 
                                                        padding: '0.2rem 0.5rem', 
                                                        borderRadius: '0.4rem', 
                                                        backgroundColor: res.type === 'SALE' ? '#065f46' : (res.type === 'PURCHASE' ? '#1e3a8a' : '#334155'), 
                                                        color: 'white' 
                                                    }}>
                                                        {res.type === 'SALE' ? 'VENTA' : (res.type === 'PURCHASE' ? 'COMPRA' : 'PENDIENTE')}
                                                    </span>
                                                </div>
                                                <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.25rem' }}>{res.customer?.name}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ color: 'white', fontWeight: '700' }}>{formatCurrency(res.total, res.currency === 'USD' ? '$' : 'S/')}</div>
                                                <div style={{ fontSize: '0.75rem', color: res.status === 'SUCCESS' ? '#10b981' : '#f59e0b', fontWeight: 'bold', marginTop: '0.25rem' }}>
                                                    {res.status === 'SUCCESS' ? 'TRANSACCIÓN VALIDADA' : 'TRANSACCIÓN EN INCUBACIÓN'}
                                                </div>
                                            </div>
                                        </div>

                                        {!res.success ? (
                                            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <AlertCircle size={16} color="#ef4444" />
                                                <span style={{ color: '#fca5a5', fontSize: '0.85rem' }}>{res.message}</span>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                                <div style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem', borderRadius: '0.75rem' }}>
                                                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: '700', textTransform: 'uppercase' }}>Integridad Maestro Clientes</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        {res.customer?.is_confirmed ? <CheckCircle size={14} color="#10b981" /> : <AlertCircle size={14} color="#f59e0b" />}
                                                        <span style={{ color: res.customer?.is_confirmed ? '#10b981' : '#f59e0b', fontSize: '0.85rem' }}>
                                                            {res.customer?.is_confirmed ? 'Cliente Vinculado' : `RUC ${res.customer?.ruc} No Encontrado`}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem', borderRadius: '0.75rem' }}>
                                                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: '700', textTransform: 'uppercase' }}>Integridad de Catálogo</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        {res.catalog?.is_confirmed ? <CheckCircle size={14} color="#10b981" /> : <Database size={14} color="#f59e0b" />}
                                                        <span style={{ color: res.catalog?.is_confirmed ? '#10b981' : '#f59e0b', fontSize: '0.85rem' }}>
                                                            {res.catalog?.is_confirmed ? 'Items Mapeados al 100%' : `${res.catalog?.unmapped_count} Items por Sincerar`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ padding: '1.5rem 2rem', backgroundColor: '#1e293b', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                {ingestSummary.some(r => !r.customer?.is_confirmed) && (
                                    <Button size="sm" variant="success" onClick={() => { setIngestSummary(null); setActiveTab('master'); }}>Vincular Clientes</Button>
                                )}
                                {ingestSummary.some(r => !r.catalog?.is_confirmed) && (
                                    <Button size="sm" variant="warning" onClick={() => { setIngestSummary(null); setActiveTab('catalog'); }}>Mapear Catálogo</Button>
                                )}
                                {ingestSummary.some(r => r.success && r.type === 'SALE') && (
                                    <Button size="sm" variant="primary" onClick={() => { setIngestSummary(null); setActiveTab('logistics'); }}>Gestionar Logística</Button>
                                )}
                            </div>
                            <Button variant="secondary" onClick={() => setIngestSummary(null)}>Cerrar Resumen</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinancialSincerityInbox;
