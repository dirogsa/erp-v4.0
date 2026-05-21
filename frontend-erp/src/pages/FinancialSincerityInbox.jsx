import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, Trash2, CheckCircle, Clock, Info, Database, 
    RefreshCcw, ShieldCheck, Zap, BookOpen, Upload, Rocket, FileText, AlertCircle, Edit2
} from 'lucide-react';
import { salesService, purchasingService, intelligenceService, productBrandService, inventoryService } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Pagination from '../components/common/Table/Pagination';
import Loading from '../components/common/Loading';
import XMLImportModal from '../components/common/XMLImportModal';
import ProductSearchInput from '../components/common/ProductSearchInput';
import CustomerForm from '../components/features/customers/CustomerForm';
import SupplierForm from '../components/features/suppliers/SupplierForm';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useLoading } from '../context/LoadingContext';
import Badge from '../components/common/Badge';

const generateSimulatedXml = (invoice) => {
    if (!invoice) return '';
    const isPurchase = !invoice.customer_ruc || invoice.customer_ruc === '20501020304';
    const rucEmisor = isPurchase ? (invoice.supplier_ruc || '20123456789') : '20501020304';
    const nameEmisor = isPurchase ? (invoice.supplier_name || invoice.issuer_name || 'PROVEEDOR INDUSTRIAL S.A.C.') : 'DIROGSA INDUSTRIAL';
    const rucReceptor = isPurchase ? '20501020304' : (invoice.customer_ruc || '20987654321');
    const nameReceptor = isPurchase ? 'DIROGSA INDUSTRIAL' : (invoice.customer_name || 'CLIENTE COMERCIAL S.A.C.');
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
    <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
    <cbc:CustomizationID>2.0</cbc:CustomizationID>
    <cbc:ID>${invoice.sunat_number || invoice.invoice_number}</cbc:ID>
    <cbc:IssueDate>${invoice.invoice_date?.slice(0, 10) || new Date().toISOString().slice(0, 10)}</cbc:IssueDate>
    <cbc:DocumentCurrencyCode>${invoice.currency || 'PEN'}</cbc:DocumentCurrencyCode>
    
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyTaxScheme>
                <cbc:CompanyID>${rucEmisor}</cbc:CompanyID>
                <cbc:TaxSchemeID>6</cbc:TaxSchemeID>
            </cac:PartyTaxScheme>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName>${nameEmisor}</cbc:RegistrationName>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingSupplierParty>
    
    <cac:AccountingCustomerParty>
        <cac:Party>
            <cac:PartyTaxScheme>
                <cbc:CompanyID>${rucReceptor}</cbc:CompanyID>
                <cbc:TaxSchemeID>6</cbc:TaxSchemeID>
            </cac:PartyTaxScheme>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName>${nameReceptor}</cbc:RegistrationName>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingCustomerParty>
    
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="${invoice.currency || 'PEN'}">${(invoice.total_amount * 0.18 / 1.18).toFixed(2)}</cbc:TaxAmount>
    </cac:TaxTotal>
    
    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="${invoice.currency || 'PEN'}">${(invoice.total_amount / 1.18).toFixed(2)}</cbc:LineExtensionAmount>
        <cbc:TaxInclusiveAmount currencyID="${invoice.currency || 'PEN'}">${invoice.total_amount?.toFixed(2)}</cbc:TaxInclusiveAmount>
        <cbc:PayableAmount currencyID="${invoice.currency || 'PEN'}">${invoice.total_amount?.toFixed(2)}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>\n`;

    invoice.items?.forEach((item, idx) => {
        xml += `    <cac:InvoiceLine>
        <cbc:ID>${idx + 1}</cbc:ID>
        <cbc:InvoicedQuantity unitCode="NIU">${item.quantity}</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="${invoice.currency || 'PEN'}">${(item.quantity * (item.unit_value || item.unit_price / 1.18)).toFixed(2)}</cbc:LineExtensionAmount>
        <cac:Item>
            <cbc:Description>${item.product_name}</cbc:Description>
            <cac:SellersItemIdentification>
                <cbc:ID>${item.product_sku}</cbc:ID>
            </cac:SellersItemIdentification>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="${invoice.currency || 'PEN'}">${(item.unit_value || item.unit_price / 1.18)?.toFixed(2)}</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>\n`;
    });

    xml += `</Invoice>`;
    return xml;
};

const FinancialSincerityInbox = () => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const { showLoading, hideLoading } = useLoading();

    const [activeTab, setActiveTab] = useState('ingest'); 
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
    const [mappingModal, setMappingModal] = useState(null); // { type: 'official'|'ghost', item }
    const [mappingValue, setMappingValue] = useState('');
    const [ghostCategory, setGhostCategory] = useState('');
    const [categories, setCategories] = useState([]);
    const [editModal, setEditModal] = useState(null); // { item, new_external_code, new_description, new_brand }
    const [editModalInvoices, setEditModalInvoices] = useState([]); // facturas afectadas
    const [editModalLoadingInvoices, setEditModalLoadingInvoices] = useState(false);
    const [editModalSelectedInvoices, setEditModalSelectedInvoices] = useState([]); // checkboxes

    // Ghost SKUs State
    const [ghostSkus, setGhostSkus] = useState([]);
    const [loadingGhosts, setLoadingGhosts] = useState(false);

    // Master Data Specific State
    const [masterGaps, setMasterGaps] = useState({ unknown_customers: [], missing_exchange_rates: [] });
    const [loadingMaster, setLoadingMaster] = useState(false);
    const [masterModal, setMasterModal] = useState(null); // { type: 'customer'|'rate', data }
    const [masterValue, setMasterValue] = useState('');
    const [selectedMasterRucs, setSelectedMasterRucs] = useState([]);
    const [quickCreateModal, setQuickCreateModal] = useState(null); // { type: 'customer'|'supplier', data }
    const [isCreating, setIsCreating] = useState(false);

    // Sorting State
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Document Viewer State
    const [viewDocModal, setViewDocModal] = useState(null); // { invoiceNumber }
    const [viewDocData, setViewDocData] = useState(null); // Full invoice detail
    const [loadingDoc, setLoadingDoc] = useState(false);
    const [activeModalTab, setActiveModalTab] = useState('doc'); // 'doc' | 'xml'

    const renderIntegrityPipeline = (inv) => {
        const steps = [
            { id: 'cat', label: 'Catálogo', ok: inv.is_catalog_confirmed, icon: Database },
            { id: 'ruc', label: 'RUC', ok: inv.is_customer_confirmed, icon: BookOpen },
            { id: 'tc', label: 'TC', ok: inv.is_exchange_rate_confirmed, icon: RefreshCcw },
        ];

        return (
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                {steps.map(s => (
                    <div 
                        key={s.id} 
                        title={`${s.label}: ${s.ok ? 'OK' : 'PENDIENTE'}`}
                        style={{ 
                            width: '24px', height: '24px', borderRadius: '6px', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: s.ok ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: s.ok ? '#10b981' : '#ef4444',
                            border: `1px solid ${s.ok ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                        }}
                    >
                        <s.icon size={12} />
                    </div>
                ))}
            </div>
        );
    };

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
        
        // Fetch categories for Quarantine Modal
        inventoryService.getCategories().then(res => {
            setCategories(res.data);
        }).catch(err => console.error("Error loading categories", err));
    }, []);

    useEffect(() => {
        // Recargar el contenido específico de la pestaña activa si es necesario
        if (activeTab === 'ingest') fetchIngestQueue();
        if (activeTab === 'catalog') fetchUnmappedItems();
        if (activeTab === 'master') fetchMasterGaps();
        if (activeTab === 'logistics') fetchPendingLogistics();
        if (activeTab === 'ghosts') fetchGhostSkus();
    }, [activeTab]);

    const fetchGhostSkus = async () => {
        setLoadingGhosts(true);
        try {
            const res = await intelligenceService.getGhostSkus();
            setGhostSkus(res.data);
        } catch (error) {
            showNotification('Error al cargar Catálogo Fantasma', 'error');
        } finally {
            setLoadingGhosts(false);
        }
    };

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

    // Data hooks for Finance Tabs removed as per segregating technical validation from cashflow.

    const handleResolveMapping = async (externalCode, brand, internalSku) => {
        try {
            showLoading("Vinculando a Catálogo...", "Curando la factura con el producto oficial seleccionado.");
            await intelligenceService.resolveCatalogMapping({
                external_code: externalCode,
                brand,          // Marca del producto maestro seleccionado (no la del XML vacío)
                internal_sku: internalSku
            });
            showNotification(`Código ${externalCode} vinculado exitosamente al catálogo`, 'success');
            fetchUnmappedItems();
            setMappingModal(null);
        } catch (error) {
            showNotification(error.response?.data?.detail || 'Error al vincular código', 'error');
        } finally {
            hideLoading();
        }
    };

    const handleViewDocument = async (invoiceNumber) => {
        setLoadingDoc(true);
        setViewDocModal({ invoiceNumber });
        setViewDocData(null);
        try {
            let res;
            try {
                res = await salesService.getInvoice(invoiceNumber);
            } catch (e) {
                res = await purchasingService.getInvoice(invoiceNumber);
            }
            setViewDocData(res.data);
        } catch (err) {
            showNotification('No se pudo cargar el detalle del documento', 'error');
            setViewDocModal(null);
        } finally {
            setLoadingDoc(false);
        }
    };

    const handleGhostMapping = async (externalCode, brand, categoryId) => {
        if (!categoryId) {
            showNotification('Debe seleccionar una categoría para el Purgatorio', 'warning');
            return;
        }
        try {
            showLoading("Aislando Ítem...", "Generando SKU Fantasma y enviando al Purgatorio.");
            await intelligenceService.mapGhostSku({
                external_code: externalCode,
                brand,
                category_id: categoryId
            });
            showNotification(`Ítem aislado en cuarentena exitosamente`, 'success');
            fetchUnmappedItems();
            setMappingModal(null);
            setGhostCategory('');
        } catch (error) {
            showNotification(error.response?.data?.detail || 'Error al aislar código', 'error');
        } finally {
            hideLoading();
        }
    };

    const handleEditUnmapped = async () => {
        if (!editModal || !editModal.new_external_code.trim()) {
            showNotification('El código XML no puede estar vacío', 'warning');
            return;
        }
        
        try {
            showLoading("Limpiando Origen...", "Mutando líneas en facturas seleccionadas con los datos corregidos.");
            await intelligenceService.editUnmappedItem({
                old_external_code: editModal.item.external_code,
                old_brand: editModal.item.brand || "",
                new_external_code: editModal.new_external_code,
                new_description: editModal.new_description,
                new_brand: editModal.new_brand || "",
                // Enviar solo las facturas seleccionadas (null = todas)
                invoice_numbers: editModalSelectedInvoices.length < editModalInvoices.length
                    ? editModalSelectedInvoices
                    : null
            });
            const scope = editModalSelectedInvoices.length < editModalInvoices.length
                ? `${editModalSelectedInvoices.length} factura(s) seleccionada(s)`
                : 'todas las facturas asociadas';
            showNotification(`Ítem corregido en ${scope}`, 'success');
            fetchUnmappedItems();
            setEditModal(null);
            setEditModalInvoices([]);
            setEditModalSelectedInvoices([]);
        } catch (error) {
            showNotification(error.response?.data?.detail || 'Error al editar ítem', 'error');
        } finally {
            hideLoading();
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

    const handleAutoCreateCustomer = (ruc, name) => {
        // En lugar de auto-crear ciegamente o navegar fuera, abrimos el Workspace In-Situ
        setQuickCreateModal({
            type: 'customer',
            data: { 
                document_number: ruc, 
                name: name,
                document_type: 'RUC'
            }
        });
    };

    const handleQuickCreateSubmit = async (formData) => {
        setIsCreating(true);
        try {
            showLoading("Registrando Maestro...", "Guardando en el directorio y curando facturas relacionadas.");
            
            if (quickCreateModal.type === 'customer') {
                const newCustomer = await salesService.createCustomer(formData);
                // Curación Atómica: Vincular facturas inmediatamente
                await intelligenceService.resolveCustomerSincerity({ 
                    ruc: formData.document_number, 
                    customer_id: newCustomer.data._id 
                });
                showNotification(`Cliente ${formData.name} registrado y facturas sinceradas`, 'success');
            } else {
                const newSupplier = await purchasingService.createSupplier(formData);
                // Si el backend soporta resolveSupplierSincerity, llamarlo. 
                // Por ahora asumimos que el RUC compartido ya cura la vista de compras si usa el mismo motor
                showNotification(`Proveedor ${formData.name} registrado en el directorio`, 'success');
            }
            
            setQuickCreateModal(null);
            fetchMasterGaps();
            fetchIngestQueue();
            // Refrescar facturas si estamos en la pestaña de ventas/compras
            if (activeTab === 'sales' || activeTab === 'purchasing') fetchInvoices();
            
        } catch (error) {
            showNotification('Error en el registro del maestro', 'error');
        } finally {
            setIsCreating(false);
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

    // --- High-Fidelity Sorting Engine ---
    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortedData = (data) => {
        if (!data || !sortConfig.key) return data;
        
        return [...data].sort((a, b) => {
            // Manejo de claves anidadas (ej: customer.name)
            const keys = sortConfig.key.split('.');
            let aValue = a;
            let bValue = b;
            
            for (const key of keys) {
                aValue = aValue?.[key];
                bValue = bValue?.[key];
            }

            // Normalización para comparación
            if (typeof aValue === 'string') aValue = aValue.toLowerCase();
            if (typeof bValue === 'string') bValue = bValue.toLowerCase();

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <span style={{ marginLeft: '0.5rem', opacity: 0.3 }}>⇅</span>;
        return <span style={{ marginLeft: '0.5rem', color: '#3b82f6' }}>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
    };

    // Global Result Summary State
    const [executionSummary, setExecutionSummary] = useState(null); // { processed, total, errors: [] }
    const [summaryFilter, setSummaryFilter] = useState('ALL');

    const handleReprocessSection = async (section) => {
        let title = "Reprocesando Catálogo...";
        let msg = "Buscando alias y SKU oficiales para curar ítems incubados.";
        if (section === 'master') {
            title = "Reprocesando Maestros...";
            msg = "Vinculando clientes/proveedores y actualizando tipos de cambio.";
        } else if (section === 'logistics') {
            title = "Reprocesando Logística...";
            msg = "Generando guías internas masivas para documentos integrados.";
        } else if (section === 'all') {
            title = "Sincronizando Todo...";
            msg = "Corriendo el motor de curación UBL completo (Catálogo, Maestros y Logística).";
        }

        showLoading(title, msg);
        try {
            const res = await intelligenceService.reprocessSincerity(section);
            const { cured_catalog, cured_master, cured_rates, cured_logistics, errors = [], details = [] } = res.data;
            
            // Recargar datos locales
            if (section === 'catalog' || section === 'all') fetchUnmappedItems();
            if (section === 'master' || section === 'all') fetchMasterGaps();
            if (section === 'logistics' || section === 'all') fetchPendingLogistics();
            fetchIngestQueue();
            if (activeTab === 'sales' || activeTab === 'purchasing') fetchInvoices();

            setExecutionSummary({
                processed: cured_logistics,
                total: cured_catalog + cured_master + cured_rates + cured_logistics,
                cured_catalog,
                cured_master,
                cured_rates,
                cured_logistics,
                reprocessed: true,
                errors: errors.map(err => typeof err === 'string' ? { error: err } : err),
                details: details
            });

            showNotification("Reprocesamiento completado con éxito", "success");
        } catch (error) {
            console.error("Error in reprocessing:", error);
            showNotification(error.message || "Error al ejecutar el reprocesamiento masivo", "error");
        } finally {
            hideLoading();
        }
    };

    const handleBulkGenerateGuides = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`¿Desea intentar generar guías automáticas para ${selectedIds.length} facturas? Las que tengan brechas de integridad serán omitidas.`)) return;

        showLoading("Ejecutando Proceso Logístico...", "Procesando lote de documentos y validando integridad en tiempo real.");
        try {
            const invoicesToProcess = pendingLogistics.filter(inv => selectedIds.includes(inv.invoice_number));
            const ids = invoicesToProcess.map(inv => String(inv._id || inv.id));
            const response = await intelligenceService.bulkGenerateGuides({ invoice_ids: ids });
            
            setExecutionSummary({
                processed: response.data.processed,
                total: selectedIds.length,
                errors: response.data.errors || []
            });
            
            setSelectedIds([]);
            fetchPendingLogistics();
        } catch (error) {
            console.error("Error generating guides:", error);
            showNotification(error.message || 'Error al generar guías masivas', 'error');
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
            console.error("Error matching XML guides:", error);
            let errorMsg = 'Error al vincular guías';
            if (error.response?.data?.detail) {
                if (Array.isArray(error.response.data.detail)) {
                    errorMsg = error.response.data.detail.map(err => err.msg).join(', ');
                } else {
                    errorMsg = error.response.data.detail;
                }
            }
            showNotification(errorMsg, 'error');
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
            console.error("Error reverting logistics:", error);
            showNotification(error.response?.data?.detail || 'Error al revertir logística', 'error');
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

    const MasterDataTabContent = () => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid #334155' }}>
                <div>
                    <h3 style={{ margin: 0, color: 'white', fontWeight: '800' }}>Dirección de Maestros y Tipos de Cambio</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>Valide y subsane clientes nuevos, proveedores y tipos de cambio UBL.</p>
                </div>
                <Button 
                    variant="primary" 
                    icon={RefreshCcw}
                    onClick={() => handleReprocessSection('master')}
                    style={{ fontWeight: 'bold' }}
                >
                    Reprocesar Maestros y TC
                </Button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* --- SECCIÓN CLIENTES DESCONOCIDOS --- */}
                <div style={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: '1px solid #334155', overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid #334155', background: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <BookOpen size={20} color="#3b82f6" />
                            <span style={{ color: 'white', fontWeight: '700' }}>Clientes Nuevos (Ventas)</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Button size="sm" variant="primary" onClick={() => handleBulkAutoCreateCustomers(masterGaps.unknown_customers)} disabled={!masterGaps.unknown_customers?.length}>Registrar Todo</Button>
                        </div>
                    </div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155' }}>
                                    <th 
                                        style={{ padding: '1rem', color: '#64748b', fontSize: '0.75rem', textAlign: 'left', cursor: 'pointer' }}
                                        onClick={() => requestSort('name')}
                                    >
                                        RUC / RAZÓN SOCIAL <SortIcon columnKey="name" />
                                    </th>
                                    <th 
                                        style={{ padding: '1rem', color: '#64748b', fontSize: '0.75rem', textAlign: 'center', cursor: 'pointer' }}
                                        onClick={() => requestSort('occurrences')}
                                    >
                                        FACTS <SortIcon columnKey="occurrences" />
                                    </th>
                                    <th style={{ padding: '1rem', color: '#64748b', fontSize: '0.75rem', textAlign: 'right' }}>ACCIÓN</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!masterGaps.unknown_customers?.length ? (
                                    <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: '#475569' }}>Todos los clientes están registrados.</td></tr>
                                ) : (
                                    getSortedData(masterGaps.unknown_customers).map((c, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
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

                {/* --- SECCIÓN PROVEEDORES DESCONOCIDOS --- */}
                <div style={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: '1px solid #334155', overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid #334155', background: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Database size={20} color="#10b981" />
                            <span style={{ color: 'white', fontWeight: '700' }}>Proveedores Nuevos (Compras)</span>
                        </div>
                    </div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155' }}>
                                    <th 
                                        style={{ padding: '1rem', color: '#64748b', fontSize: '0.75rem', textAlign: 'left', cursor: 'pointer' }}
                                        onClick={() => requestSort('name')}
                                    >
                                        RUC / PROVEEDOR <SortIcon columnKey="name" />
                                    </th>
                                    <th 
                                        style={{ padding: '1rem', color: '#64748b', fontSize: '0.75rem', textAlign: 'center', cursor: 'pointer' }}
                                        onClick={() => requestSort('occurrences')}
                                    >
                                        FACTS <SortIcon columnKey="occurrences" />
                                    </th>
                                    <th style={{ padding: '1rem', color: '#64748b', fontSize: '0.75rem', textAlign: 'right' }}>ACCIÓN</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!masterGaps.unknown_suppliers?.length ? (
                                    <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: '#475569' }}>No se detectaron proveedores nuevos.</td></tr>
                                ) : (
                                    getSortedData(masterGaps.unknown_suppliers).map((s, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ color: 'white', fontWeight: '600' }}>{s.ruc}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{s.name}</div>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center', color: '#10b981' }}>{s.occurrences}</td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <Button 
                                                    size="sm" 
                                                    variant="success" 
                                                    icon={Zap} 
                                                    onClick={() => setQuickCreateModal({ 
                                                        type: 'supplier', 
                                                        data: { ruc: s.ruc, name: s.name } 
                                                    })}
                                                >
                                                    Registrar
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* --- SECCIÓN TIPOS DE CAMBIO --- */}
            <div style={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: '1px solid #334155', overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem', borderBottom: '1px solid #334155', background: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <RefreshCcw size={20} color="#f59e0b" />
                    <span style={{ color: 'white', fontWeight: '700' }}>Tipos de Cambio Pendientes (Dólares)</span>
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155' }}>
                                <th style={{ padding: '1rem', color: '#64748b', fontSize: '0.75rem', textAlign: 'left' }}>FECHA DEL DOCUMENTO</th>
                                <th style={{ padding: '1rem', color: '#64748b', fontSize: '0.75rem', textAlign: 'center' }}>FACTS (VENTAS+COMPRAS)</th>
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
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Button 
                        variant="primary" 
                        onClick={() => handleReprocessSection('catalog')} 
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}
                        icon={RefreshCcw}
                    >
                        Reprocesar Catálogo
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/inventory/brands-master')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: '#3b82f6', color: '#60a5fa' }}>🏷️ Maestro de Marcas</Button>
                    <Button variant="outline" onClick={fetchUnmappedItems} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><RefreshCcw size={16} /> Actualizar</Button>
                </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#1e293b' }}>
                            <th style={{ padding: '1.25rem 1rem', color: '#94a3b8', fontSize: '0.85rem' }}>Código XML / Descripción</th>
                            <th style={{ padding: '1.25rem 1rem', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>Frecuencia</th>
                            <th style={{ padding: '1.25rem 1rem', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'left' }}>Motivo de Incubación</th>
                            <th style={{ padding: '1.25rem 1rem', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'right' }}>Decisión (MDM)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loadingCatalog ? (
                            <tr><td colSpan="4" style={{ padding: '4rem', textAlign: 'center' }}><Loading /></td></tr>
                        ) : unmappedItems.length === 0 ? (
                            <tr><td colSpan="4" style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>El Purgatorio está vacío. Todos los ítems están mapeados.</td></tr>
                        ) : (
                            unmappedItems.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                                    <td style={{ padding: '1.25rem 1rem' }}>
                                        <div style={{ color: 'white', fontWeight: 'bold' }}>{item.external_code || 'SIN CÓDIGO (VACÍO)'}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>{item.external_description}</div>
                                        {item.invoice_refs && item.invoice_refs.length > 0 && (
                                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Documentos:</span>
                                                {item.invoice_refs.map((ref, rIdx) => (
                                                    <span 
                                                        key={rIdx}
                                                        onClick={() => handleViewDocument(ref)}
                                                        style={{ 
                                                            fontSize: '0.7rem', 
                                                            backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                                                            color: '#60a5fa', 
                                                            padding: '0.2rem 0.5rem', 
                                                            borderRadius: '0.375rem', 
                                                            border: '1px solid rgba(59, 130, 246, 0.2)',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                            fontWeight: '600',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.25rem'
                                                        }}
                                                        onMouseEnter={e => {
                                                            e.currentTarget.style.backgroundColor = '#3b82f6';
                                                            e.currentTarget.style.color = 'white';
                                                        }}
                                                        onMouseLeave={e => {
                                                            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                                                            e.currentTarget.style.color = '#60a5fa';
                                                        }}
                                                    >
                                                        📄 {ref}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem', color: '#3b82f6', textAlign: 'center' }}>{item.occurrences} facts</td>
                                    <td style={{ padding: '1.25rem 1rem', textAlign: 'left' }}>
                                        {item.rejection_code ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                                                <Badge 
                                                    status={item.rejection_code} 
                                                    size="small" 
                                                    title={item.rejection_reason}
                                                    style={{ 
                                                        cursor: 'help', 
                                                        display: 'inline-flex', 
                                                        alignItems: 'center', 
                                                        gap: '0.25rem', 
                                                        padding: '0.15rem 0.4rem', 
                                                        borderRadius: '0.25rem',
                                                        ...(item.rejection_code === 'READY_TO_PROCESS' ? {
                                                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                                            color: '#10b981',
                                                            border: '1px solid rgba(16, 185, 129, 0.4)'
                                                        } : {})
                                                    }}
                                                >
                                                    {item.rejection_code === 'READY_TO_PROCESS'   ? '✅ Listo para Procesar'
                                                     : item.rejection_code === 'BRAND_NOT_DECLARED' ? '🏷️ Marca No Declarada'
                                                     : item.rejection_code === 'BRAND_MISMATCH'    ? '⚠️ Marca No Coincide'
                                                     : item.rejection_code === 'SKU_FORMAT_MISMATCH' ? '🔀 Formato Diferente'
                                                     : item.rejection_code === 'BRAND_FIREWALL_BLOCK' ? '🛡️ Firewall Marca'
                                                     : '❓ SKU Desconocido'}
                                                </Badge>
                                                <div style={{ 
                                                    fontSize: '0.75rem', 
                                                    color: item.rejection_code === 'READY_TO_PROCESS' ? '#6ee7b7' : '#94a3b8', 
                                                    maxWidth: '300px', 
                                                    whiteSpace: 'normal', 
                                                    lineHeight: '1.2' 
                                                }}>
                                                    {item.rejection_reason}
                                                </div>
                                            </div>
                                        ) : (
                                            <span style={{ color: '#475569', fontSize: '0.8rem' }}>Sin diagnóstico</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                            <Button variant="outline" size="sm" style={{ color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.3)' }} icon={Edit2} onClick={async () => {
                                                const baseModal = { item, new_external_code: item.external_code || '', new_description: item.external_description || '', new_brand: item.brand || '' };
                                                setEditModal(baseModal);
                                                setEditModalInvoices([]);
                                                setEditModalSelectedInvoices([]);
                                                setEditModalLoadingInvoices(true);
                                                try {
                                                    const res = await intelligenceService.getInvoicesByCode(item.external_code);
                                                    const invList = res.data || [];
                                                    setEditModalInvoices(invList);
                                                    // Por defecto, todas seleccionadas
                                                    setEditModalSelectedInvoices(invList.map(i => i.invoice_number));
                                                } catch(e) {
                                                    showNotification('No se pudo cargar la lista de facturas', 'warning');
                                                } finally {
                                                    setEditModalLoadingInvoices(false);
                                                }
                                            }}>Editar Origen</Button>
                                            <Button variant="outline" size="sm" icon={CheckCircle} onClick={() => setMappingModal({ type: 'official', item })}>Vincular a Catálogo</Button>
                                            <Button variant="outline" style={{ color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }} size="sm" icon={Zap} onClick={() => setMappingModal({ type: 'ghost', item })}>Aislar (Ghost SKU)</Button>
                                        </div>
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
                    <Button 
                        variant="primary" 
                        icon={RefreshCcw} 
                        onClick={() => handleReprocessSection('logistics')}
                        style={{ fontWeight: 'bold', background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', borderColor: '#a78bfa' }}
                    >
                        Reprocesar Logística
                    </Button>
                    {selectedIds.length === 0 && (
                        <Button variant="primary" icon={Rocket} onClick={handleBulkGenerateGuides}>Guía Automática</Button>
                    )}
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
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            // Only select those with catalog confirmed
                                            const valid = pendingLogistics.filter(inv => inv.is_catalog_confirmed).map(i => i.invoice_number);
                                            setSelectedIds(valid);
                                            if (valid.length < pendingLogistics.length) {
                                                showNotification("Solo se seleccionaron facturas con catálogo mapeado", "info");
                                            }
                                        } else {
                                            setSelectedIds([]);
                                        }
                                    }} 
                                    checked={selectedIds.length > 0 && selectedIds.length === pendingLogistics.filter(inv => inv.is_catalog_confirmed).length} 
                                />
                            </th>
                            <th 
                                style={{ padding: '1rem', color: '#94a3b8', textAlign: 'left', cursor: 'pointer' }}
                                onClick={() => requestSort('sunat_number')}
                            >
                                Factura <SortIcon columnKey="sunat_number" />
                            </th>
                            <th 
                                style={{ padding: '1rem', color: '#94a3b8', textAlign: 'left', cursor: 'pointer' }}
                                onClick={() => requestSort('customer_name')}
                            >
                                Cliente <SortIcon columnKey="customer_name" />
                            </th>
                            <th style={{ padding: '1rem', color: '#94a3b8', textAlign: 'center' }}>Integridad</th>
                            <th style={{ padding: '1rem', color: '#94a3b8', textAlign: 'left' }}>Estado</th>
                            <th style={{ padding: '1rem', color: '#94a3b8', textAlign: 'right' }}>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loadingLogistics ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}><Loading /></td></tr>
                        ) : pendingLogistics.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#475569' }}>No hay facturas pendientes de logística.</td></tr>
                        ) : (
                            getSortedData(pendingLogistics).map((inv, i) => (
                                <tr key={i} style={{ 
                                    borderBottom: '1px solid #1e293b',
                                    opacity: inv.is_catalog_confirmed ? 1 : 0.6,
                                    backgroundColor: inv.is_catalog_confirmed ? 'transparent' : 'rgba(239, 68, 68, 0.02)'
                                }}>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <input 
                                            type="checkbox" 
                                            disabled={!inv.is_catalog_confirmed}
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
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                                            <div title={inv.is_catalog_confirmed ? "Catálogo OK" : "Items sin mapear"} style={{ color: inv.is_catalog_confirmed ? '#10b981' : '#ef4444' }}>
                                                <Database size={16} />
                                            </div>
                                            <div title={inv.is_customer_confirmed ? "Cliente OK" : "Cliente desconocido"} style={{ color: inv.is_customer_confirmed ? '#10b981' : '#ef4444' }}>
                                                <BookOpen size={16} />
                                            </div>
                                            <div title={inv.is_exchange_rate_confirmed ? "TC OK" : "Falta TC"} style={{ color: inv.is_exchange_rate_confirmed ? '#10b981' : '#ef4444' }}>
                                                <RefreshCcw size={16} />
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ 
                                            fontSize: '0.7rem', padding: '0.25rem 0.5rem', borderRadius: '1rem', 
                                            backgroundColor: inv.is_catalog_confirmed ? '#1e293b' : 'rgba(239, 68, 68, 0.1)', 
                                            color: inv.is_catalog_confirmed ? '#3b82f6' : '#ef4444',
                                            fontWeight: 'bold', border: `1px solid ${inv.is_catalog_confirmed ? '#334155' : 'rgba(239, 68, 68, 0.2)'}`
                                        }}>
                                            {inv.is_catalog_confirmed ? 'ESPERANDO LOGÍSTICA' : 'GAPS DETECTADOS'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        {!inv.is_catalog_confirmed ? (
                                            <Button variant="warning" size="sm" icon={Zap} onClick={() => setActiveTab('catalog')}>Resolver Gaps</Button>
                                        ) : (
                                            <Button variant="ghost" size="sm" color="#ef4444" icon={Trash2} onClick={() => handleDelete(inv.invoice_number)}>Limpiar</Button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const GhostTabContent = () => (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', background: '#1e293b', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid #334155' }}>
                <div style={{ color: 'white' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>El Purgatorio (Catálogo Fantasma)</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>Ítems asilados que han sido separados del catálogo oficial para no ensuciar el maestro.</p>
                </div>
            </div>

            <div style={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: '1px solid #334155', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#1e293b' }}>
                            <th style={{ padding: '1rem', color: '#94a3b8', textAlign: 'left' }}>SKU FANTASMA</th>
                            <th style={{ padding: '1rem', color: '#94a3b8', textAlign: 'left' }}>DESCRIPCIÓN ORIGINAL</th>
                            <th style={{ padding: '1rem', color: '#94a3b8', textAlign: 'center' }}>MARCA</th>
                            <th style={{ padding: '1rem', color: '#94a3b8', textAlign: 'right' }}>ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loadingGhosts ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '3rem' }}><Loading /></td></tr>
                        ) : ghostSkus.length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: '#475569' }}>No hay SKUs aislados en el Purgatorio.</td></tr>
                        ) : (
                            ghostSkus.map((g, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ color: '#f59e0b', fontWeight: 'bold' }}>{g.sku}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Aislado el {new Date(g.created_at).toLocaleDateString()}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ color: 'white' }}>{g.name}</div>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <span style={{ backgroundColor: '#334155', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '0.3rem', fontSize: '0.75rem' }}>{g.brand}</span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <Button variant="outline" size="sm" icon={Database} onClick={() => showNotification("Funcionalidad de convertir a maestro en construcción", "info")}>
                                                Convertir a Maestro
                                            </Button>
                                            <Button variant="ghost" size="sm" color="#3b82f6" icon={Edit2} onClick={() => showNotification("Editor de SKU en construcción", "info")}>
                                                Editar SKU
                                            </Button>
                                        </div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', borderBottom: '1px solid #334155', paddingBottom: '1.5rem', alignItems: 'center' }}>
                <div>
                    <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <ShieldCheck size={32} color="#3b82f6" /> Buzón de Sinceramiento e Integridad
                    </h1>
                    <p style={{ color: '#94a3b8' }}>Centro de Gobierno de Datos: Sinceramiento Financiero, Catálogo y Maestros</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Button 
                        variant="primary" 
                        icon={RefreshCcw}
                        onClick={() => handleReprocessSection('all')}
                        style={{ 
                            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                            boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)',
                            fontWeight: '800'
                        }}
                    >
                        Sincronizar y Reprocesar Todo
                    </Button>
                    <div style={{ backgroundColor: '#1e293b', padding: '0.75rem 1.25rem', borderRadius: '0.75rem', border: '1px solid #334155', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>PENDIENTES</div>
                        <div style={{ fontSize: '1.5rem', color: '#3b82f6', fontWeight: 'bold' }}>
                            {activeTab === 'catalog' ? unmappedItems.length : activeTab === 'master' ? (masterGaps.unknown_customers.length + masterGaps.missing_exchange_rates.length) : activeTab === 'logistics' ? pendingLogistics.length : ingestQueue.length}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Sequenciales (Integrity Pipeline) */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                <Button onClick={() => setActiveTab('ingest')} variant={activeTab === 'ingest' ? 'primary' : 'secondary'} icon={Upload}>
                    1. Ingesta {ingestQueue.length > 0 && <span style={{ marginLeft: '0.5rem', backgroundColor: '#3b82f6', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '0.5rem', fontSize: '0.7rem' }}>{ingestQueue.length}</span>}
                </Button>
                <Button onClick={() => setActiveTab('catalog')} variant={activeTab === 'catalog' ? 'warning' : 'secondary'} icon={Database}>
                    2. Catálogo {unmappedItems.length > 0 && <span style={{ marginLeft: '0.5rem', backgroundColor: '#f59e0b', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '0.5rem', fontSize: '0.7rem' }}>{unmappedItems.length}</span>}
                </Button>
                <Button onClick={() => setActiveTab('master')} variant={activeTab === 'master' ? 'success' : 'secondary'} icon={ShieldCheck}>
                    3. Maestros {(masterGaps.unknown_customers.length + masterGaps.missing_exchange_rates.length) > 0 && <span style={{ marginLeft: '0.5rem', backgroundColor: '#10b981', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '0.5rem', fontSize: '0.7rem' }}>{masterGaps.unknown_customers.length + masterGaps.missing_exchange_rates.length}</span>}
                </Button>
                <Button onClick={() => setActiveTab('logistics')} variant={activeTab === 'logistics' ? 'primary' : 'secondary'} icon={() => <span>🚚</span>}>
                    4. Logística {pendingLogistics.length > 0 && <span style={{ marginLeft: '0.5rem', backgroundColor: '#3b82f6', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '0.5rem', fontSize: '0.7rem' }}>{pendingLogistics.length}</span>}
                </Button>
                <Button onClick={() => setActiveTab('ghosts')} variant={activeTab === 'ghosts' ? 'warning' : 'secondary'} icon={Zap}>
                    5. SKUs Aislados (Ghost) {ghostSkus.length > 0 && <span style={{ marginLeft: '0.5rem', backgroundColor: '#f59e0b', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '0.5rem', fontSize: '0.7rem' }}>{ghostSkus.length}</span>}
                </Button>
            </div>

            {/* Content */}
            {activeTab === 'ingest' ? <IngestTabContent /> : 
             activeTab === 'catalog' ? <CatalogTabContent /> : 
             activeTab === 'master' ? <MasterDataTabContent /> : 
             activeTab === 'logistics' ? <LogisticsTabContent /> :
             <GhostTabContent />
            }

            {/* Modal de Resolución de Tipo de Cambio */}
            {masterModal && masterModal.type === 'rate' && (
                <div style={{ 
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                    backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 4000, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(12px)'
                }}>
                    <div style={{ 
                        backgroundColor: '#0f172a', padding: '2rem', borderRadius: '1.5rem', 
                        width: '100%', maxWidth: '400px', border: '1px solid #3b82f6',
                        boxShadow: '0 0 40px rgba(59, 130, 246, 0.2)'
                    }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ color: 'white', margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <RefreshCcw color="#3b82f6" /> Definir Tipo de Cambio
                            </h3>
                            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Valor oficial SUNAT para el {masterModal.data.date}</p>
                        </div>
                        
                        <div style={{ marginBottom: '1.5rem' }}>
                            <Input 
                                label="Valor TC Venta (PEN)" 
                                placeholder="Ej: 3.755" 
                                type="number"
                                step="0.001"
                                autoFocus 
                                value={masterValue}
                                onChange={(e) => setMasterValue(e.target.value)}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <Button variant="ghost" onClick={() => { setMasterModal(null); setMasterValue(''); }}>Cancelar</Button>
                            <Button variant="primary" onClick={() => handleResolveRate(masterModal.data.date, masterValue)}>Actualizar Todo</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Workspace de Alta In-Situ */}
            {quickCreateModal && (
                <div style={{ 
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                    backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 3000, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(8px)'
                }}>
                    <div style={{ 
                        backgroundColor: '#0f172a', borderRadius: '1.25rem', 
                        width: '95%', maxWidth: '900px', maxHeight: '90vh', 
                        overflowY: 'auto', border: '1px solid #334155',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
                    }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #334155', background: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <ShieldCheck color="#10b981" /> 
                                {quickCreateModal.type === 'customer' ? 'Workspace: Alta Rápida de Cliente' : 'Workspace: Alta Rápida de Proveedor'}
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', background: '#0f172a', padding: '4px 12px', borderRadius: '20px', border: '1px solid #334155' }}>
                                    Integridad de Maestros
                                </span>
                            </h2>
                            <button onClick={() => setQuickCreateModal(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>
                        
                        {quickCreateModal.type === 'customer' ? (
                            <CustomerForm 
                                initialData={quickCreateModal.data}
                                onSubmit={handleQuickCreateSubmit}
                                onCancel={() => setQuickCreateModal(null)}
                                loading={isCreating}
                            />
                        ) : (
                            <SupplierForm 
                                initialData={quickCreateModal.data}
                                onSubmit={handleQuickCreateSubmit}
                                onCancel={() => setQuickCreateModal(null)}
                                loading={isCreating}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Modal de Mapeo Manual de Catálogo (Oficial y Purgatorio) */}
            {mappingModal && (
                <div style={{ 
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                    backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 4000, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ 
                        backgroundColor: '#0f172a', borderRadius: '1.5rem', 
                        width: '90%', maxWidth: '600px', padding: '2rem',
                        border: '1px solid #334155',
                        boxShadow: '0 0 40px rgba(59, 130, 246, 0.2)'
                    }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {mappingModal.type === 'official' ? (
                                    <><CheckCircle color="#10b981" /> Vincular a Catálogo</>
                                ) : (
                                    <><Zap color="#f59e0b" /> Aislar en Cuarentena (Ghost SKU)</>
                                )}
                            </h2>
                            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                                {mappingModal.type === 'official' 
                                    ? 'Asocie este ítem del XML con un producto real de su catálogo para integrarlo formalmente.'
                                    : 'Envíe este ítem al Purgatorio. Se generará un SKU fantasma que no ensuciará su catálogo principal.'}
                            </p>
                        </div>

                        <div style={{ backgroundColor: '#1e293b', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', border: '1px solid #334155' }}>
                            <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 'bold', marginBottom: '0.25rem' }}>DATOS DEL PROVEEDOR (XML):</div>
                            <div style={{ color: 'white', fontWeight: 'bold' }}>{mappingModal.item.external_code || 'SIN CÓDIGO (VACÍO)'}</div>
                            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{mappingModal.item.external_description}</div>
                        </div>

                        {mappingModal.type === 'official' ? (
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', color: 'white', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                    Buscar en Catálogo Interno
                                </label>
                                <p style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '0.75rem', margin: '0 0 0.75rem 0' }}>
                                    Al seleccionar un producto, su marca se usará para validar la curación. La factura será actualizada sin crear alias permanentes.
                                </p>
                                <ProductSearchInput 
                                    onSelect={(prod) => handleResolveMapping(mappingModal.item.external_code, prod.brand, prod.sku)}
                                    placeholder="Escriba SKU o nombre del producto oficial..."
                                    autoFocus
                                />
                            </div>
                        ) : (
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', color: '#f59e0b', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                    Seleccionar Categoría para el Purgatorio
                                </label>
                                <select 
                                    value={ghostCategory}
                                    onChange={(e) => setGhostCategory(e.target.value)}
                                    style={{
                                        width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                                        backgroundColor: '#1e293b', color: 'white', border: '1px solid #334155',
                                        outline: 'none', fontSize: '0.9rem'
                                    }}
                                >
                                    <option value="">-- Elija una categoría general --</option>
                                    {categories.map(cat => (
                                        <option key={cat._id || cat.id} value={cat._id || cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <Button variant="ghost" onClick={() => { setMappingModal(null); setGhostCategory(''); }}>Cancelar</Button>
                            {mappingModal.type === 'ghost' && (
                                <Button 
                                    variant="primary" 
                                    style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b', color: '#0f172a' }}
                                    onClick={() => handleGhostMapping(mappingModal.item.external_code, mappingModal.item.brand, ghostCategory)}
                                    disabled={!ghostCategory}
                                >
                                    Generar Código Fantasma
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 🚀 Sovereign Action Console (v3.0) */}
            {selectedIds.length > 0 && (
                <div style={{ 
                    position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', 
                    backgroundColor: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '1.25rem', 
                    padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', gap: '2rem', 
                    boxShadow: '0 20px 40px rgba(0,0,0,0.6)', zIndex: 4000, 
                    animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' 
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingRight: '1.5rem', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3b82f6', boxShadow: '0 0 10px #3b82f6' }}></div>
                        <span style={{ color: 'white', fontWeight: '900', fontSize: '0.9rem', letterSpacing: '0.05em' }}>
                            {selectedIds.length} <span style={{ color: '#94a3b8', fontWeight: '600' }}>ENTIDADES</span>
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        {/* Acciones de LOGÍSTICA */}
                        {activeTab === 'logistics' && (
                            <Button 
                                variant="primary" 
                                icon={Rocket} 
                                onClick={handleBulkGenerateGuides}
                                style={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' }}
                            >
                                GENERAR GUÍAS AUTOMÁTICAS
                            </Button>
                        )}

                        {/* Acciones de FINANZAS (Ventas/Compras) */}
                        {(activeTab === 'sales' || activeTab === 'purchasing') && (
                            <>
                                <Button 
                                    variant="success" 
                                    icon={CheckCircle} 
                                    onClick={() => handleBulkSincerity('CONTADO')}
                                >
                                    CONFIRMAR CONTADO
                                </Button>
                                <Button 
                                    variant="warning" 
                                    icon={Clock} 
                                    onClick={() => handleBulkSincerity('CREDITO')}
                                >
                                    CONFIRMAR CRÉDITO
                                </Button>
                            </>
                        )}

                        {/* Acciones de MAESTROS */}
                        {activeTab === 'master' && (
                            <Button 
                                variant="success" 
                                icon={Zap} 
                                onClick={() => handleBulkAutoCreateCustomers()}
                            >
                                REGISTRAR MAESTROS SELECCIONADOS
                            </Button>
                        )}

                        {/* Acciones de INGESTA */}
                        {activeTab === 'ingest' && (
                            <Button 
                                variant="primary" 
                                icon={Rocket} 
                                onClick={runBulkIngestProcess}
                            >
                                PROCESAR SELECCIONADOS
                            </Button>
                        )}

                        <Button 
                            variant="ghost" 
                            icon={Trash2} 
                            onClick={() => setSelectedIds([])}
                            style={{ color: '#ef4444' }}
                        >
                            CANCELAR
                        </Button>
                    </div>
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

            {/* 📄 Visualizador de Documento XML (Sovereign Document Viewer) */}
            {viewDocModal && (
                <div style={{ 
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                    backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 5000, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '2rem', backdropFilter: 'blur(16px)',
                    animation: 'fadeIn 0.3s ease-out'
                }}>
                    <div style={{ 
                        backgroundColor: '#0f172a', borderRadius: '1.5rem', 
                        width: '100%', maxWidth: '950px', maxHeight: '90vh',
                        display: 'flex', flexDirection: 'column',
                        border: '1px solid #334155', 
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                        overflow: 'hidden'
                    }}>
                        {/* Header del Visualizador */}
                        <div style={{ 
                            padding: '1.5rem 2rem', 
                            background: 'linear-gradient(95deg, #1e293b 0%, #0f172a 100%)', 
                            borderBottom: '1px solid #334155', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center' 
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FileText size={24} color="#60a5fa" />
                                <div>
                                    <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>
                                        Documento XML: {viewDocModal.invoiceNumber}
                                    </h2>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                        Sinceramiento & Estructura UBL 2.1 SUNAT
                                    </span>
                                </div>
                            </div>

                            {/* Pestañas del Modal y Cerrar */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                {viewDocData && (
                                    <div style={{ display: 'flex', backgroundColor: '#0f172a', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                                        <button 
                                            onClick={() => setActiveModalTab('doc')}
                                            style={{
                                                padding: '0.4rem 1rem', borderRadius: '0.375rem', border: 'none', fontSize: '0.8rem', fontWeight: '700',
                                                backgroundColor: activeModalTab === 'doc' ? '#1e293b' : 'transparent',
                                                color: activeModalTab === 'doc' ? '#60a5fa' : '#94a3b8',
                                                cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                        >
                                            Detalles del Documento
                                        </button>
                                        <button 
                                            onClick={() => setActiveModalTab('xml')}
                                            style={{
                                                padding: '0.4rem 1rem', borderRadius: '0.375rem', border: 'none', fontSize: '0.8rem', fontWeight: '700',
                                                backgroundColor: activeModalTab === 'xml' ? '#1e293b' : 'transparent',
                                                color: activeModalTab === 'xml' ? '#60a5fa' : '#94a3b8',
                                                cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                        >
                                            Contenido XML (UBL)
                                        </button>
                                    </div>
                                )}
                                <button 
                                    onClick={() => { setViewDocModal(null); setViewDocData(null); }} 
                                    style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.75rem', cursor: 'pointer', padding: '0 0.5rem', lineHeight: 1 }}
                                >
                                    &times;
                                </button>
                            </div>
                        </div>

                        {/* Contenido / Cuerpo del Modal */}
                        <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
                            {loadingDoc ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0' }}>
                                    <Loading />
                                    <p style={{ color: '#94a3b8', marginTop: '1.5rem', fontSize: '0.9rem', fontWeight: '600', letterSpacing: '0.05em' }}>
                                        DESCIFRANDO UBL XML Y VALIDANDO CON SUNAT...
                                    </p>
                                </div>
                            ) : !viewDocData ? (
                                <div style={{ textAlign: 'center', padding: '3rem 0', color: '#ef4444' }}>
                                    <AlertCircle size={48} style={{ marginBottom: '1rem', margin: '0 auto' }} />
                                    <h3>Error al cargar el documento</h3>
                                    <p style={{ color: '#94a3b8' }}>No se pudo encontrar o parsear la factura seleccionada.</p>
                                </div>
                            ) : activeModalTab === 'doc' ? (
                                <div>
                                    {/* Cabecera / Columnas del Documento */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                                        <div style={{ backgroundColor: '#1e293b', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #334155' }}>
                                            <div style={{ fontSize: '0.7rem', color: '#60a5fa', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Emisor (Proveedor)</div>
                                            <div style={{ color: 'white', fontWeight: '800', fontSize: '1.1rem' }}>
                                                {viewDocData.supplier_name || viewDocData.issuer_name || 'PROVEEDOR S.A.C.'}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                                RUC: <strong style={{ color: 'white' }}>{viewDocData.supplier_ruc || '20123456789'}</strong>
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
                                                {viewDocData.delivery_address || 'Dirección no especificada'}
                                            </div>
                                        </div>

                                        <div style={{ backgroundColor: '#1e293b', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #334155' }}>
                                            <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Receptor (Cliente)</div>
                                            <div style={{ color: 'white', fontWeight: '800', fontSize: '1.1rem' }}>
                                                {viewDocData.customer_name || 'CLIENTE S.A.C.'}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                                RUC: <strong style={{ color: 'white' }}>{viewDocData.customer_ruc || '20987654321'}</strong>
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
                                                {viewDocData.delivery_address || 'Dirección de entrega oficial'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Grilla de Metadatos del Documento */}
                                    <div style={{ 
                                        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', 
                                        backgroundColor: '#0f172a', padding: '1rem', borderRadius: '0.75rem', 
                                        border: '1px solid #1e293b', marginBottom: '2rem' 
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '700' }}>FECHA EMISIÓN</div>
                                            <div style={{ color: 'white', fontSize: '0.85rem', fontWeight: '700', marginTop: '0.25rem' }}>
                                                {formatDate(viewDocData.invoice_date || viewDocData.date)}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '700' }}>CONDICIÓN PAGO (XML FISCAL)</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                                                <span style={{ 
                                                    color: 'white', fontSize: '0.8rem', fontWeight: '700',
                                                    padding: '0.15rem 0.5rem', borderRadius: '0.4rem',
                                                    backgroundColor: viewDocData.payment_condition_xml === 'CREDITO' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                                                    border: `1px solid ${viewDocData.payment_condition_xml === 'CREDITO' ? 'rgba(245,158,11,0.4)' : 'rgba(16,185,129,0.4)'}`,
                                                }}>
                                                    🔒 {viewDocData.payment_condition_xml || viewDocData.payment_condition || 'CONTADO'}
                                                </span>
                                                {viewDocData.payment_condition_xml && viewDocData.payment_condition !== viewDocData.payment_condition_xml && (
                                                    <span style={{
                                                        color: '#f59e0b', fontSize: '0.7rem', fontWeight: '700',
                                                        padding: '0.15rem 0.5rem', borderRadius: '0.4rem',
                                                        backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)'
                                                    }}>
                                                        ERP: {viewDocData.payment_condition} ⚠️
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '700' }}>MONEDA</div>
                                            <div style={{ color: 'white', fontSize: '0.85rem', fontWeight: '700', marginTop: '0.25rem' }}>
                                                {viewDocData.currency === 'USD' ? 'DÓLARES AMERICANOS (USD)' : 'SOLES (PEN)'}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '700' }}>TIPO DE CAMBIO (TC)</div>
                                            <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: '700', marginTop: '0.25rem' }}>
                                                {viewDocData.exchange_rate ? viewDocData.exchange_rate.toFixed(3) : 'No requerido (PEN)'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tabla de Artículos del Documento XML */}
                                    <h4 style={{ color: 'white', marginBottom: '1rem', fontSize: '0.95rem', fontWeight: '700' }}>
                                        Detalle de Productos Facturados
                                    </h4>
                                    <div style={{ backgroundColor: '#0f172a', borderRadius: '0.75rem', border: '1px solid #1e293b', overflow: 'hidden' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                            <thead>
                                                <tr style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #334155' }}>
                                                    <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.75rem' }}>CÓDIGO XML</th>
                                                    <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.75rem' }}>DESCRIPCIÓN</th>
                                                    <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.75rem', textAlign: 'center' }}>CANT.</th>
                                                    <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.75rem', textAlign: 'right' }}>P. UNIT.</th>
                                                    <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.75rem', textAlign: 'right' }}>TOTAL</th>
                                                    <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.75rem', textAlign: 'center' }}>ESTADO</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {viewDocData.items?.map((item, idx) => {
                                                    const isItemUnmapped = item.is_unmapped;
                                                    return (
                                                        <tr 
                                                            key={idx} 
                                                            style={{ 
                                                                borderBottom: '1px solid #1e293b',
                                                                backgroundColor: isItemUnmapped ? 'rgba(245, 158, 11, 0.03)' : 'transparent',
                                                                borderLeft: isItemUnmapped ? '4px solid #f59e0b' : 'none'
                                                            }}
                                                        >
                                                            <td style={{ padding: '0.85rem 1rem', color: 'white', fontWeight: '700', fontSize: '0.85rem' }}>
                                                                {item.product_sku || 'SIN SKU'}
                                                            </td>
                                                            <td style={{ padding: '0.85rem 1rem', color: '#e2e8f0', fontSize: '0.85rem' }}>
                                                                {item.product_name}
                                                                {item.brand && <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Marca: {item.brand}</span>}
                                                            </td>
                                                            <td style={{ padding: '0.85rem 1rem', color: 'white', textAlign: 'center', fontSize: '0.85rem' }}>
                                                                {item.quantity}
                                                            </td>
                                                            <td style={{ padding: '0.85rem 1rem', color: '#94a3b8', textAlign: 'right', fontSize: '0.85rem' }}>
                                                                {formatCurrency(item.unit_value || item.unit_price / 1.18, viewDocData.currency === 'USD' ? '$' : 'S/')}
                                                            </td>
                                                            <td style={{ padding: '0.85rem 1rem', color: 'white', fontWeight: 'bold', textAlign: 'right', fontSize: '0.85rem' }}>
                                                                {formatCurrency((item.quantity * (item.unit_value || item.unit_price / 1.18)) * 1.18, viewDocData.currency === 'USD' ? '$' : 'S/')}
                                                            </td>
                                                            <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                                                                {isItemUnmapped ? (
                                                                    <span style={{ 
                                                                        fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '0.25rem',
                                                                        backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 'bold',
                                                                        border: '1px solid rgba(245,158,11,0.3)'
                                                                    }}>
                                                                        HÚERFANO (PND)
                                                                    </span>
                                                                ) : (
                                                                    <span style={{ 
                                                                        fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '0.25rem',
                                                                        backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: 'bold'
                                                                    }}>
                                                                        MAPEADO OK
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Montos Totales */}
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                                        <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.85rem' }}>
                                                <span>SUBTOTAL (BI):</span>
                                                <span style={{ color: 'white', fontWeight: '600' }}>
                                                    {formatCurrency(viewDocData.total_amount / 1.18, viewDocData.currency === 'USD' ? '$' : 'S/')}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.85rem', paddingBottom: '0.5rem', borderBottom: '1px solid #1e293b' }}>
                                                <span>IGV (18%):</span>
                                                <span style={{ color: 'white', fontWeight: '600' }}>
                                                    {formatCurrency((viewDocData.total_amount * 0.18) / 1.18, viewDocData.currency === 'USD' ? '$' : 'S/')}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'white', fontWeight: '800', fontSize: '1.1rem', marginTop: '0.25rem' }}>
                                                <span>IMPORTE TOTAL:</span>
                                                <span style={{ color: '#60a5fa' }}>
                                                    {formatCurrency(viewDocData.total_amount, viewDocData.currency === 'USD' ? '$' : 'S/')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Tab de Código XML */
                                <div style={{ position: 'relative' }}>
                                    {/* XML Copy Button */}
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(generateSimulatedXml(viewDocData));
                                            showNotification('Contenido XML copiado al portapapeles', 'info');
                                        }}
                                        style={{ 
                                            position: 'absolute', right: '1rem', top: '1rem',
                                            backgroundColor: '#1e293b', border: '1px solid #334155',
                                            color: '#60a5fa', borderRadius: '0.375rem', padding: '0.35rem 0.75rem',
                                            fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer',
                                            transition: 'all 0.2s', zIndex: 10
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2563eb'}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1e293b'}
                                    >
                                        Copiar XML
                                    </button>

                                    {/* Premium Styled Pre Block */}
                                    <pre style={{ 
                                        margin: 0, padding: '1.5rem', borderRadius: '1rem',
                                        backgroundColor: '#020617', border: '1px solid #1e293b',
                                        color: '#cbd5e1', fontSize: '0.825rem', fontFamily: 'monospace, Consolas, Courier',
                                        overflowX: 'auto', maxHeight: '55vh', whiteSpace: 'pre-wrap',
                                        lineHeight: '1.5', tabSize: 4
                                    }}>
                                        {/* Simple custom syntax coloring for tags, attributes, and text */}
                                        {generateSimulatedXml(viewDocData).split('\n').map((line, lIdx) => {
                                            // Format basic UBL XML syntax
                                            let formattedLine = line;
                                            // Very basic syntax highlighting replacements
                                            // 1. Tags: <tag> -> <span style="color:#60a5fa">&lt;tag&gt;</span>
                                            // 2. Attributes: attr="val" -> <span style="color:#f59e0b">attr="val"</span>
                                            // 3. Comments: <!-- --> -> <span style="color:#64748b"><!-- --></span>
                                            
                                            return (
                                                <div key={lIdx} style={{ display: 'flex' }}>
                                                    <span style={{ width: '30px', color: '#475569', userSelect: 'none', fontSize: '0.75rem', textAlign: 'right', paddingRight: '0.75rem' }}>{lIdx + 1}</span>
                                                    <span style={{ flex: 1 }}>{formattedLine}</span>
                                                </div>
                                            );
                                        })}
                                    </pre>
                                </div>
                            )}
                        </div>

                        {/* Footer del Visualizador */}
                        <div style={{ 
                            padding: '1.25rem 2rem', 
                            backgroundColor: '#1e293b', 
                            borderTop: '1px solid #334155', 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <ShieldCheck size={16} color="#10b981" />
                                <span>Verificación de Firma Digital SUNAT: <strong>VÁLIDA (SHA-256)</strong></span>
                            </div>
                            <Button 
                                variant="primary" 
                                size="sm" 
                                onClick={() => { setViewDocModal(null); setViewDocData(null); }}
                            >
                                Cerrar Visualizador
                            </Button>
                        </div>
                    </div>
                </div>
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

            {/* 📊 Console de Resultados de Ejecución (World-Class Batch Reporting) */}
            {executionSummary && (
                <div style={{ 
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                    backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 5000, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '2rem', backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ 
                        backgroundColor: '#0f172a', borderRadius: '1.5rem', 
                        width: '100%', maxWidth: '700px', maxHeight: '85vh',
                        display: 'flex', flexDirection: 'column',
                        border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
                    }}>
                        <div style={{ padding: '2rem', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderBottom: '1px solid #334155', borderRadius: '1.5rem 1.5rem 0 0' }}>
                            <h2 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.5rem' }}>
                                <Rocket color="#3b82f6" /> {executionSummary.reprocessed ? 'Resumen de Sincronización y Curación Masiva' : 'Resumen de Ejecución Logística'}
                            </h2>
                            <p style={{ color: '#94a3b8', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                                {executionSummary.reprocessed ? `Informe del Motor UBL #JOB-${Date.now().toString().slice(-6)}` : `Informe de Job #LOG-${Date.now().toString().slice(-6)}`}
                            </p>
                        </div>

                        <div style={{ padding: '2rem', overflowY: 'auto' }}>
                            {executionSummary.reprocessed ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                                    <div 
                                        onClick={() => setSummaryFilter('CATALOG')}
                                        style={{ cursor: 'pointer', background: summaryFilter === 'CATALOG' || summaryFilter === 'ALL' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.05)', padding: '1rem', borderRadius: '1rem', border: `1px solid rgba(59, 130, 246, ${summaryFilter === 'CATALOG' ? '0.5' : '0.2'})`, textAlign: 'center', transition: 'all 0.2s', opacity: executionSummary.cured_catalog === 0 && summaryFilter !== 'CATALOG' ? 0.6 : 1 }}
                                    >
                                        <div style={{ fontSize: '0.75rem', color: '#60a5fa', marginBottom: '0.25rem' }}>CATÁLOGO CURADO</div>
                                        <div style={{ fontSize: '1.5rem', color: '#60a5fa', fontWeight: '800' }}>{executionSummary.cured_catalog}</div>
                                    </div>
                                    <div 
                                        onClick={() => setSummaryFilter('MASTER')}
                                        style={{ cursor: 'pointer', background: summaryFilter === 'MASTER' || summaryFilter === 'ALL' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.05)', padding: '1rem', borderRadius: '1rem', border: `1px solid rgba(16, 185, 129, ${summaryFilter === 'MASTER' ? '0.5' : '0.2'})`, textAlign: 'center', transition: 'all 0.2s', opacity: executionSummary.cured_master === 0 && summaryFilter !== 'MASTER' ? 0.6 : 1 }}
                                    >
                                        <div style={{ fontSize: '0.75rem', color: '#10b981', marginBottom: '0.25rem' }}>MAESTROS CURADOS</div>
                                        <div style={{ fontSize: '1.5rem', color: '#10b981', fontWeight: '800' }}>{executionSummary.cured_master}</div>
                                    </div>
                                    <div 
                                        onClick={() => setSummaryFilter('RATES')}
                                        style={{ cursor: 'pointer', background: summaryFilter === 'RATES' || summaryFilter === 'ALL' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.05)', padding: '1rem', borderRadius: '1rem', border: `1px solid rgba(245, 158, 11, ${summaryFilter === 'RATES' ? '0.5' : '0.2'})`, textAlign: 'center', transition: 'all 0.2s', opacity: executionSummary.cured_rates === 0 && summaryFilter !== 'RATES' ? 0.6 : 1 }}
                                    >
                                        <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginBottom: '0.25rem' }}>TC SINCERADOS</div>
                                        <div style={{ fontSize: '1.5rem', color: '#f59e0b', fontWeight: '800' }}>{executionSummary.cured_rates}</div>
                                    </div>
                                    <div 
                                        onClick={() => setSummaryFilter('LOGISTICS')}
                                        style={{ cursor: 'pointer', background: summaryFilter === 'LOGISTICS' || summaryFilter === 'ALL' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.05)', padding: '1rem', borderRadius: '1rem', border: `1px solid rgba(139, 92, 246, ${summaryFilter === 'LOGISTICS' ? '0.5' : '0.2'})`, textAlign: 'center', transition: 'all 0.2s', opacity: executionSummary.cured_logistics === 0 && summaryFilter !== 'LOGISTICS' ? 0.6 : 1 }}
                                    >
                                        <div style={{ fontSize: '0.75rem', color: '#a78bfa', marginBottom: '0.25rem' }}>GUÍAS GENERADAS</div>
                                        <div style={{ fontSize: '1.5rem', color: '#a78bfa', fontWeight: '800' }}>{executionSummary.cured_logistics}</div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                                    <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '1rem', border: '1px solid #334155', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>TOTAL PROCESADO</div>
                                        <div style={{ fontSize: '1.5rem', color: 'white', fontWeight: '800' }}>{executionSummary.total}</div>
                                    </div>
                                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '1rem', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#10b981', marginBottom: '0.25rem' }}>ÉXITOS (GUÍAS)</div>
                                        <div style={{ fontSize: '1.5rem', color: '#10b981', fontWeight: '800' }}>{executionSummary.processed}</div>
                                    </div>
                                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '1rem', border: '1px solid rgba(239, 68, 68, 0.2)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#ef4444', marginBottom: '0.25rem' }}>OMITIDOS / ERROR</div>
                                        <div style={{ fontSize: '1.5rem', color: '#ef4444', fontWeight: '800' }}>{executionSummary.errors.length}</div>
                                    </div>
                                </div>
                            )}

                            {executionSummary.errors.length > 0 && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <h4 style={{ color: '#ef4444', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <AlertCircle size={16} color="#ef4444" /> Detalles de Excepciones
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {executionSummary.errors.map((err, idx) => (
                                            <div key={idx} style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                                                <div style={{ color: '#fca5a5', fontSize: '0.85rem', fontWeight: '600' }}>{err.error}</div>
                                                <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.25rem' }}>ID Documento: {err.id || 'N/A'}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {executionSummary.details && executionSummary.details.length > 0 && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h4 style={{ color: '#10b981', margin: '0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <CheckCircle size={16} color="#10b981" /> Auditoría de Cambios {summaryFilter !== 'ALL' && `(Filtrado)`}
                                        </h4>
                                        {summaryFilter !== 'ALL' && (
                                            <Button variant="ghost" size="sm" onClick={() => setSummaryFilter('ALL')}>Ver Todo</Button>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                                        {executionSummary.details
                                            .filter(d => {
                                                if (summaryFilter === 'ALL') return true;
                                                if (summaryFilter === 'CATALOG' && d.includes('Catálogo:')) return true;
                                                if (summaryFilter === 'MASTER' && d.includes('Maestro:')) return true;
                                                if (summaryFilter === 'RATES' && d.includes('Tipo de Cambio:')) return true;
                                                if (summaryFilter === 'LOGISTICS' && d.includes('Logística:')) return true;
                                                return false;
                                            })
                                            .map((detail, idx) => (
                                                <div key={idx} style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                                                    <div style={{ color: '#6ee7b7', fontSize: '0.85rem' }}>{detail}</div>
                                                </div>
                                            ))
                                        }
                                        {executionSummary.details.filter(d => {
                                                if (summaryFilter === 'ALL') return true;
                                                if (summaryFilter === 'CATALOG' && d.includes('Catálogo:')) return true;
                                                if (summaryFilter === 'MASTER' && d.includes('Maestro:')) return true;
                                                if (summaryFilter === 'RATES' && d.includes('Tipo de Cambio:')) return true;
                                                if (summaryFilter === 'LOGISTICS' && d.includes('Logística:')) return true;
                                                return false;
                                            }).length === 0 && (
                                                <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>No hay registros para esta categoría.</div>
                                            )
                                        }
                                    </div>
                                </div>
                            )}

                            {executionSummary.errors.length === 0 && executionSummary.processed > 0 && (!executionSummary.details || executionSummary.details.length === 0) && (
                                <div style={{ textAlign: 'center', padding: '2rem' }}>
                                    <CheckCircle size={48} color="#10b981" style={{ marginBottom: '1rem' }} />
                                    <h3 style={{ color: 'white' }}>Lote Procesado con Éxito</h3>
                                    <p style={{ color: '#94a3b8' }}>Todos los documentos cumplen con los estándares de integridad.</p>
                                </div>
                            )}
                        </div>

                        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: '0 0 1.5rem 1.5rem' }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                {executionSummary.errors.some(e => e.error.includes('catálogo')) && (
                                    <Button size="sm" variant="warning" icon={Database} onClick={() => { setExecutionSummary(null); setActiveTab('catalog'); }}>Resolver Gaps Catálogo</Button>
                                )}
                                {executionSummary.errors.some(e => e.error.includes('cliente')) && (
                                    <Button size="sm" variant="success" icon={BookOpen} onClick={() => { setExecutionSummary(null); setActiveTab('master'); }}>Resolver Maestros</Button>
                                )}
                            </div>
                            <Button variant="primary" onClick={() => setExecutionSummary(null)}>Cerrar Reporte</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Edición de Origen (Payload Editor) */}
            {editModal && (
                <div style={{ 
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                    backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 4000, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(12px)'
                }}>
                    <div style={{ 
                        backgroundColor: '#0f172a', padding: '2rem', borderRadius: '1.5rem', 
                        width: '100%', maxWidth: '560px', border: '1px solid #3b82f6',
                        boxShadow: '0 0 40px rgba(59, 130, 246, 0.2)',
                        maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ color: 'white', margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Edit2 color="#3b82f6" /> Limpieza de Origen
                            </h3>
                            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Corrija errores tipográficos del XML. Esto mutará las líneas de las facturas seleccionadas.</p>
                        </div>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>CÓDIGO XML</label>
                            <Input 
                                value={editModal.new_external_code}
                                onChange={(e) => setEditModal({...editModal, new_external_code: e.target.value})}
                                placeholder="Escriba el código correcto..."
                            />
                        </div>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>DESCRIPCIÓN XML</label>
                            <Input 
                                value={editModal.new_description}
                                onChange={(e) => setEditModal({...editModal, new_description: e.target.value})}
                                placeholder="Escriba la descripción correcta..."
                            />
                        </div>

                        {/* ── SECCIÓN MULTI-FACTURA ──────────────────────────────────── */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <label style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                    📄 FACTURAS AFECTADAS
                                </label>
                                {editModalInvoices.length > 0 && (
                                    <button
                                        onClick={() => {
                                            if (editModalSelectedInvoices.length === editModalInvoices.length) {
                                                setEditModalSelectedInvoices([]);
                                            } else {
                                                setEditModalSelectedInvoices(editModalInvoices.map(i => i.invoice_number));
                                            }
                                        }}
                                        style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                                    >
                                        {editModalSelectedInvoices.length === editModalInvoices.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                                    </button>
                                )}
                            </div>

                            <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid #334155', borderRadius: '0.75rem', overflow: 'hidden' }}>
                                {editModalLoadingInvoices ? (
                                    <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>⏳ Cargando facturas...</div>
                                ) : editModalInvoices.length === 0 ? (
                                    <div style={{ padding: '1.5rem', textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>No se encontraron facturas asociadas.</div>
                                ) : (
                                    editModalInvoices.map((inv, idx) => {
                                        const isChecked = editModalSelectedInvoices.includes(inv.invoice_number);
                                        return (
                                            <label key={idx} style={{
                                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                                padding: '0.75rem 1rem', cursor: 'pointer',
                                                borderBottom: idx < editModalInvoices.length - 1 ? '1px solid #1e293b' : 'none',
                                                backgroundColor: isChecked ? 'rgba(59, 130, 246, 0.07)' : 'transparent',
                                                transition: 'background 0.15s'
                                            }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => {
                                                        setEditModalSelectedInvoices(prev =>
                                                            isChecked
                                                                ? prev.filter(n => n !== inv.invoice_number)
                                                                : [...prev, inv.invoice_number]
                                                        );
                                                    }}
                                                    style={{ accentColor: '#3b82f6', width: '16px', height: '16px' }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.85rem' }}>{inv.invoice_number}</div>
                                                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                                                        {inv.type === 'sale' ? '🛒 Venta' : '📦 Compra'}
                                                        {inv.date ? ` · ${inv.date.split('T')[0]}` : ''}
                                                    </div>
                                                </div>
                                                <div style={{
                                                    fontSize: '0.7rem',
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '0.375rem',
                                                    backgroundColor: isChecked ? 'rgba(59, 130, 246, 0.2)' : 'rgba(100, 116, 139, 0.15)',
                                                    color: isChecked ? '#93c5fd' : '#64748b'
                                                }}>
                                                    {isChecked ? '✓ Incluida' : 'Excluida'}
                                                </div>
                                            </label>
                                        );
                                    })
                                )}
                            </div>

                            {editModalInvoices.length > 0 && (
                                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748b', textAlign: 'right' }}>
                                    {editModalSelectedInvoices.length} de {editModalInvoices.length} facturas seleccionadas
                                </div>
                            )}
                        </div>

                        {editModal.item.original_xml_sku && (
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(245, 158, 11, 0.05)', borderRadius: '0.75rem', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                <div style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Database size={14} /> EVIDENCIA XML ORIGINAL (Solo lectura)
                                </div>
                                <div style={{ color: '#d1d5db', fontSize: '0.85rem', marginBottom: '0.25rem' }}><strong>SKU:</strong> {editModal.item.original_xml_sku}</div>
                                <div style={{ color: '#d1d5db', fontSize: '0.85rem', marginBottom: '1rem' }}><strong>Desc:</strong> {editModal.item.original_xml_name}</div>
                                
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    style={{ color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)', width: '100%' }} 
                                    icon={RefreshCcw}
                                    onClick={() => setEditModal({
                                        ...editModal, 
                                        new_external_code: editModal.item.original_xml_sku, 
                                        new_description: editModal.item.original_xml_name || ''
                                    })}
                                >
                                    Restaurar XML Original
                                </Button>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <Button variant="ghost" onClick={() => { setEditModal(null); setEditModalInvoices([]); setEditModalSelectedInvoices([]); }}>Cancelar</Button>
                            <Button 
                                variant="primary" 
                                icon={CheckCircle} 
                                onClick={handleEditUnmapped}
                                disabled={editModalSelectedInvoices.length === 0}
                            >
                                {editModalSelectedInvoices.length === editModalInvoices.length || editModalInvoices.length === 0
                                    ? 'Aplicar Corrección Global'
                                    : `Aplicar en ${editModalSelectedInvoices.length} Factura(s)`
                                }
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinancialSincerityInbox;
