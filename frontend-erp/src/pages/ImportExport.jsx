import React, { useState } from 'react';
import Layout from '../components/Layout';
import { dataExchangeService } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import Button from '../components/common/Button';
import { Download, Upload, Info, Database, ShoppingCart, Truck, Tag, FileText, AlertTriangle, Receipt } from 'lucide-react';

// All entity IDs must match the ENTITY_REGISTRY keys in the backend DataExchangeService
const ENTITIES_CONFIG = {
    inventory: {
        label: 'Inventario',
        icon: <Tag size={20} />,
        color: '#60a5fa',
        entities: [
            {
                id: 'products',
                label: 'Productos',
                description: 'Catálogo completo de productos con SKU, nombres, precios y aplicaciones vehiculares.',
                badge: null
            },
            {
                id: 'warehouses',
                label: 'Almacenes / Sucursales',
                description: 'Definición de almacenes, sucursales y sus ubicaciones físicas.',
                badge: null
            }
        ]
    },
    sales: {
        label: 'Ventas',
        icon: <ShoppingCart size={20} />,
        color: '#34d399',
        entities: [
            {
                id: 'customers',
                label: 'Clientes',
                description: 'Base de datos de clientes con RUC, créditos asignados y clasificación comercial.',
                badge: null
            },
            {
                id: 'sales_quotes',
                label: 'Cotizaciones de Venta',
                description: 'Proformas emitidas al cliente. Cada fila = un ítem. Repite el número de cotización para múltiples ítems.',
                badge: 'multi-row'
            },
            {
                id: 'sales_orders',
                label: 'Órdenes de Venta',
                description: 'Pedidos confirmados por el cliente. Contiene ítems y estado de despacho.',
                badge: 'multi-row'
            },
            {
                id: 'sales_invoices',
                label: 'Facturas de Venta',
                description: 'Documentos fiscales emitidos. Incluye pagos, estado y referencia a orden de origen.',
                badge: 'multi-row'
            },
            {
                id: 'sales_notes',
                label: 'Notas de Crédito / Débito',
                description: 'Documentos de ajuste fiscal vinculados a facturas. Incluye devoluciones y descuentos.',
                badge: 'multi-row'
            },
            {
                id: 'delivery_guides',
                label: 'Guías de Remisión (Salida)',
                description: 'Guías emitidas al transportar mercadería hacia el cliente o entre almacenes.',
                badge: 'multi-row'
            }
        ]
    },
    purchasing: {
        label: 'Compras',
        icon: <Database size={20} />,
        color: '#f59e0b',
        entities: [
            {
                id: 'suppliers',
                label: 'Proveedores',
                description: 'Registro de proveedores activos con RUC, contacto y condiciones comerciales.',
                badge: null
            },
            {
                id: 'purchase_quotes',
                label: 'Cotizaciones (RFQ)',
                description: 'Solicitudes de cotización enviadas a proveedores para comparación de precios.',
                badge: 'multi-row'
            },
            {
                id: 'purchase_orders',
                label: 'Órdenes de Compra',
                description: 'Órdenes formales emitidas al proveedor. Controla lo pedido vs lo recibido.',
                badge: 'multi-row'
            },
            {
                id: 'purchase_invoices',
                label: 'Facturas de Compra',
                description: 'Facturas recibidas de proveedores (XMLs, UBL). Incluye estado de pago.',
                badge: 'multi-row'
            },
            {
                id: 'delivery_guides',
                label: 'Guías de Remisión (Entrada)',
                description: 'Guías de ingreso de mercadería desde proveedores al almacén propio.',
                badge: 'multi-row'
            }
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

    // Flat list of all entities for lookup
    const allEntities = Object.values(ENTITIES_CONFIG).flatMap(c => c.entities);
    const selectedEntityMeta = allEntities.find(e => e.id === selectedEntity);

    return (
        <Layout>
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem' }}>
                <div style={{ marginBottom: '2rem', borderBottom: '1px solid #1e293b', paddingBottom: '1.5rem' }}>
                    <h1 style={{ color: 'white', marginBottom: '0.4rem', fontSize: '1.6rem' }}>Centro de Control de Datos</h1>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>
                        Exporta plantillas CSV y vuelve a importar registros masivamente. Cada sección refleja las colecciones activas del sistema.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' }}>
                    {/* LEFT: Entity Selector */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {Object.entries(ENTITIES_CONFIG).map(([key, config]) => (
                            <div key={key}>
                                {/* Section Header */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    color: config.color,
                                    fontSize: '0.75rem', fontWeight: '800',
                                    textTransform: 'uppercase', letterSpacing: '0.1em',
                                    marginBottom: '0.6rem',
                                    paddingBottom: '0.4rem',
                                    borderBottom: `1px solid ${config.color}22`
                                }}>
                                    {config.icon} {config.label}
                                </div>
                                {/* Entity Buttons */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                    {config.entities.map(ent => {
                                        const isActive = selectedEntity === ent.id;
                                        return (
                                            <button
                                                key={ent.id}
                                                onClick={() => { setSelectedEntity(ent.id); setImportResult(null); }}
                                                style={{
                                                    textAlign: 'left',
                                                    padding: '0.6rem 0.85rem',
                                                    borderRadius: '0.5rem',
                                                    border: isActive ? `1.5px solid ${config.color}66` : '1.5px solid transparent',
                                                    background: isActive ? `${config.color}18` : 'transparent',
                                                    color: isActive ? config.color : '#94a3b8',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s',
                                                    fontSize: '0.875rem',
                                                    fontWeight: isActive ? '700' : '400',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: '0.5rem'
                                                }}
                                            >
                                                <span>{ent.label}</span>
                                                {ent.badge === 'multi-row' && (
                                                    <span style={{
                                                        fontSize: '0.6rem',
                                                        background: '#334155',
                                                        color: '#94a3b8',
                                                        padding: '1px 6px',
                                                        borderRadius: '99px',
                                                        fontWeight: '700',
                                                        letterSpacing: '0.05em',
                                                        flexShrink: 0
                                                    }}>MULTI</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* RIGHT: Operations Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                        {/* Entity Header + Actions */}
                        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '1rem', padding: '1.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                                <div style={{ flex: 1, marginRight: '1rem' }}>
                                    <h2 style={{ color: 'white', margin: '0 0 0.35rem 0', fontSize: '1.3rem' }}>
                                        {selectedEntityMeta?.label}
                                    </h2>
                                    <p style={{ color: '#64748b', margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>
                                        {selectedEntityMeta?.description}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
                                    <Button onClick={handleExport} disabled={isLoading} variant="secondary">
                                        <Download size={16} style={{ marginRight: '0.4rem' }} /> Exportar CSV
                                    </Button>
                                    <div style={{ position: 'relative' }}>
                                        <Button disabled={isLoading} variant="primary">
                                            <Upload size={16} style={{ marginRight: '0.4rem' }} /> Importar CSV
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

                            {/* Progress */}
                            {isLoading && (
                                <div style={{ textAlign: 'center', padding: '1.5rem', background: '#0f172a', borderRadius: '0.5rem', border: '1px solid #1e293b' }}>
                                    <div style={{ color: '#3b82f6', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Procesando datos...</div>
                                    <div style={{ width: '100%', height: '3px', background: '#334155', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ width: '50%', height: '100%', background: '#3b82f6', animation: 'progress 2s infinite linear' }}></div>
                                    </div>
                                    <style>{`@keyframes progress { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }`}</style>
                                </div>
                            )}

                            {/* Import Result */}
                            {importResult && (
                                <div style={{
                                    padding: '1.25rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid',
                                    borderColor: importResult.success ? '#05966944' : '#dc262644',
                                    background: importResult.success ? '#065f4633' : '#991b1b33',
                                }}>
                                    <h3 style={{ marginTop: 0, color: importResult.success ? '#34d399' : '#f87171', fontSize: '1rem' }}>
                                        {importResult.success ? '✓ Importación Completa' : '✗ Fallo en la Importación'}
                                    </h3>
                                    {importResult.success ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                            {[
                                                { label: 'Procesados', val: importResult.data.summary.total, color: 'white' },
                                                { label: 'Exitosos', val: importResult.data.summary.total - importResult.data.summary.errors, color: '#34d399' },
                                                { label: 'Errores', val: importResult.data.summary.errors, color: '#f87171' },
                                            ].map(s => (
                                                <div key={s.label} style={{ textAlign: 'center', background: '#00000033', padding: '0.75rem', borderRadius: '0.5rem' }}>
                                                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: s.color }}>{s.val}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>{s.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ color: '#f87171', fontSize: '0.9rem' }}>{importResult.error}</div>
                                    )}
                                    {importResult.data?.details?.errors?.length > 0 && (
                                        <div style={{ marginTop: '1rem', background: '#00000044', padding: '0.75rem', borderRadius: '0.5rem' }}>
                                            <strong style={{ display: 'block', fontSize: '0.8rem', color: '#f87171', marginBottom: '0.4rem' }}>Logs de Error:</strong>
                                            <div style={{ maxHeight: '130px', overflowY: 'auto', fontSize: '0.8rem', color: '#fca5a5', fontFamily: 'monospace', lineHeight: 1.6 }}>
                                                {importResult.data.details.errors.map((err, idx) => (
                                                    <div key={idx}>• {err}</div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Instructions */}
                        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '1rem', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
                                <Info size={15} /> Guía de Uso
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                                    <div style={{ color: '#60a5fa', fontSize: '0.8rem', marginBottom: '0.4rem', fontWeight: '700' }}>① Exportar Plantilla</div>
                                    <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0, lineHeight: 1.5 }}>
                                        Presiona <strong>Exportar CSV</strong> para obtener la plantilla con los campos exactos de esta entidad. Edita en Excel o Google Sheets.
                                    </p>
                                </div>
                                <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                                    <div style={{ color: '#34d399', fontSize: '0.8rem', marginBottom: '0.4rem', fontWeight: '700' }}>② Columna "operation"</div>
                                    <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0, lineHeight: 1.5 }}>
                                        Cada fila debe tener <code style={{ color: '#f59e0b' }}>INSERT</code>, <code style={{ color: '#f59e0b' }}>UPDATE</code> o <code style={{ color: '#f59e0b' }}>DELETE</code> en la primera columna.
                                    </p>
                                </div>
                                {selectedEntityMeta?.badge === 'multi-row' && (
                                    <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #f59e0b44', gridColumn: '1 / -1' }}>
                                        <div style={{ color: '#f59e0b', fontSize: '0.8rem', marginBottom: '0.4rem', fontWeight: '700' }}>⚠ Documento Multi-Fila (MULTI)</div>
                                        <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0, lineHeight: 1.5 }}>
                                            Esta entidad tiene ítems. <strong style={{ color: '#94a3b8' }}>Repite el número de documento en múltiples filas</strong>, una por producto. El sistema las agrupa automáticamente por número al importar.
                                        </p>
                                    </div>
                                )}
                                <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                                    <div style={{ color: '#a78bfa', fontSize: '0.8rem', marginBottom: '0.4rem', fontWeight: '700' }}>③ Campos Complejos</div>
                                    <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0, lineHeight: 1.5 }}>
                                        Campos como <code style={{ color: '#f59e0b' }}>applications</code> o <code style={{ color: '#f59e0b' }}>equivalences</code> se exportan como JSON. Mantén ese formato al reimportar.
                                    </p>
                                </div>
                                <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                                    <div style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '0.4rem', fontWeight: '700' }}>④ Recomendación</div>
                                    <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0, lineHeight: 1.5 }}>
                                        Siempre exporta los datos existentes antes de importar masivamente. Úsalos como respaldo y como referencia del esquema.
                                    </p>
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
