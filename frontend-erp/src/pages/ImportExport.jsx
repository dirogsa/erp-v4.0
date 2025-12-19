import React, { useState } from 'react';
import Layout from '../components/Layout';
import { dataExchangeService } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import Button from '../components/common/Button';
import { Download, Upload, Info, Database, ShoppingCart, Truck, Tag } from 'lucide-react';

const ENTITIES_CONFIG = {
    inventory: {
        label: 'Inventario',
        icon: <Tag size={20} />,
        entities: [
            { id: 'products', label: 'Productos' },
            { id: 'warehouses', label: 'Almacenes' }
        ]
    },
    sales: {
        label: 'Ventas',
        icon: <ShoppingCart size={20} />,
        entities: [
            { id: 'customers', label: 'Clientes' },
            { id: 'sales_quotes', label: 'Cotizaciones' },
            { id: 'sales_orders', label: 'Órdenes de Venta' },
            { id: 'sales_invoices', label: 'Facturas de Venta' }
        ]
    },
    purchasing: {
        label: 'Compras',
        icon: <Database size={20} />,
        entities: [
            { id: 'suppliers', label: 'Proveedores' },
            { id: 'purchase_quotes', label: 'Cotizaciones (RFQ)' },
            { id: 'purchase_orders', label: 'Órdenes de Compra' },
            { id: 'purchase_invoices', label: 'Facturas de Compra' }
        ]
    },
    logistics: {
        label: 'Logística',
        icon: <Truck size={20} />,
        entities: [
            { id: 'delivery_guides', label: 'Guías de Remisión' }
        ]
    }
};

const ImportExport = () => {
    const { showNotification } = useNotification();
    const [selectedEntity, setSelectedEntity] = useState('products');
    const [importResult, setImportResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsLoading(true);
        setImportResult(null);

        try {
            const response = await dataExchangeService.importEntity(selectedEntity, file);
            setImportResult({ success: true, data: response.data });
            showNotification('Procesamiento completado', 'success');
        } catch (error) {
            setImportResult({
                success: false,
                error: error.response?.data?.detail || error.message
            });
            showNotification('Error en la importación', 'error');
        } finally {
            setIsLoading(false);
            e.target.value = ''; // Reset file input
        }
    };

    const handleExport = async () => {
        try {
            setIsLoading(true);
            const response = await dataExchangeService.exportEntity(selectedEntity);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedEntity}_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showNotification('Exportación exitosa', 'success');
        } catch (error) {
            showNotification(`Error al exportar: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Layout>
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
                <div style={{ marginBottom: '2.5rem' }}>
                    <h1 style={{ color: 'white', marginBottom: '0.5rem' }}>Centro de Control de Datos</h1>
                    <p style={{ color: '#94a3b8' }}>Gestiona masivamente los registros de todo el sistema mediante archivos CSV profesional.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
                    {/* Panel Izquierdo: Selección de Entidad */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {Object.entries(ENTITIES_CONFIG).map(([key, config]) => (
                            <div key={key}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa', fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                                    {config.icon}
                                    {config.label}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    {config.entities.map(ent => (
                                        <button
                                            key={ent.id}
                                            onClick={() => { setSelectedEntity(ent.id); setImportResult(null); }}
                                            style={{
                                                textAlign: 'left',
                                                padding: '0.75rem 1rem',
                                                borderRadius: '0.5rem',
                                                border: 'none',
                                                background: selectedEntity === ent.id ? '#1d4ed8' : '#1e293b',
                                                color: selectedEntity === ent.id ? 'white' : '#94a3b8',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                fontSize: '0.95rem'
                                            }}
                                        >
                                            {ent.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Panel Derecho: Operaciones e Instrucciones */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '1rem', padding: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem' }}>
                                <div>
                                    <h2 style={{ color: 'white', margin: 0, fontSize: '1.5rem' }}>
                                        {Object.values(ENTITIES_CONFIG).flatMap(c => c.entities).find(e => e.id === selectedEntity)?.label}
                                    </h2>
                                    <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Gestionar importación y exportación masiva</p>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <Button onClick={handleExport} disabled={isLoading} variant="secondary">
                                        <Download size={18} style={{ marginRight: '0.5rem' }} />
                                        Exportar CSV
                                    </Button>
                                    <div style={{ position: 'relative' }}>
                                        <Button disabled={isLoading} variant="primary">
                                            <Upload size={18} style={{ marginRight: '0.5rem' }} />
                                            Importar CSV
                                            <input
                                                type="file"
                                                accept=".csv"
                                                onChange={handleImport}
                                                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                                            />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Status Section */}
                            {isLoading && (
                                <div style={{ textAlign: 'center', padding: '2rem', background: '#0f172a', borderRadius: '0.5rem', border: '1px solid #1e293b', marginBottom: '1.5rem' }}>
                                    <div style={{ color: '#3b82f6', marginBottom: '0.5rem' }}>Procesando datos...</div>
                                    <div style={{ width: '100%', height: '4px', background: '#334155', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ width: '50%', height: '100%', background: '#3b82f6', animation: 'progress 2s infinite linear' }}></div>
                                    </div>
                                    <style>{`@keyframes progress { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }`}</style>
                                </div>
                            )}

                            {/* Import Summary */}
                            {importResult && (
                                <div style={{
                                    padding: '1.5rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid',
                                    borderColor: importResult.success ? '#05966944' : '#dc262644',
                                    background: importResult.success ? '#065f4633' : '#991b1b33',
                                    marginBottom: '1.5rem'
                                }}>
                                    <h3 style={{ marginTop: 0, color: importResult.success ? '#34d399' : '#f87171', fontSize: '1.1rem' }}>
                                        {importResult.success ? 'Resumen de Importación' : 'Fallo en la Importación'}
                                    </h3>

                                    {importResult.success ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{importResult.data.summary.success}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Procesados</div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#34d399' }}>{importResult.data.summary.total - importResult.data.summary.errors}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Exitosos</div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f87171' }}>{importResult.data.summary.errors}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Errores</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ color: '#f87171', fontSize: '0.9rem' }}>{importResult.error}</div>
                                    )}

                                    {importResult.data?.details?.errors.length > 0 && (
                                        <div style={{ marginTop: '1.5rem', background: '#00000044', padding: '1rem', borderRadius: '0.5rem' }}>
                                            <strong style={{ display: 'block', fontSize: '0.85rem', color: '#f87171', marginBottom: '0.5rem' }}>Logs de Error:</strong>
                                            <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '0.85rem', color: '#fca5a5', fontFamily: 'monospace' }}>
                                                {importResult.data.details.errors.map((err, idx) => (
                                                    <div key={idx} style={{ marginBottom: '0.25rem' }}>• {err}</div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Instructions Box */}
                            <div style={{ marginTop: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontWeight: 'bold', marginBottom: '1rem' }}>
                                    <Info size={18} />
                                    Instrucciones de Arquitecto
                                </div>
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                                        <div style={{ color: '#60a5fa', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Estructura de Fila</div>
                                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                                            Cada fila debe contener la columna <code>operation</code> (INSERT, UPDATE o DELETE) y los campos definidos en la exportación.
                                        </p>
                                    </div>
                                    {['sales_quotes', 'sales_orders', 'sales_invoices', 'purchase_quotes', 'purchase_orders', 'purchase_invoices', 'delivery_guides'].includes(selectedEntity) && (
                                        <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                                            <div style={{ color: '#fbbf24', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Documentos Multipropósito</div>
                                            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                                                Para documentos con ítems (facturas, órdenes): <strong>Repite el número de documento</strong> en varias filas. Cada fila representará un producto diferente dentro del mismo documento. El sistema los agrupará automáticamente.
                                            </p>
                                        </div>
                                    )}
                                    <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                                        <div style={{ color: '#34d399', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Consejo Pro</div>
                                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                                            Exporta primero los datos actuales para obtener la plantilla exacta con los nombres de columna correctos para esta entidad.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ImportExport;
