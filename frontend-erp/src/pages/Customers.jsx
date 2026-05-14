import React, { useState } from 'react';
import Button from '../components/common/Button';
import Table from '../components/common/Table';
import Input from '../components/common/Input';
import CustomerForm from '../components/features/customers/CustomerForm';
import CustomerFinancialStatus from '../components/features/customers/CustomerFinancialStatus';
import { useCustomers } from '../hooks/useCustomers';
import { auditService, companyService, marketingService } from '../services/api';

const Customers = () => {
    const {
        customers,
        loading,
        createCustomer,
        updateCustomer,
        deleteCustomer,
        fetchCustomers
    } = useCustomers();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const [converting, setConverting] = useState(false);
    const [pointsToConvert, setPointsToConvert] = useState(0);

    const [companies, setCompanies] = useState([]);

    React.useEffect(() => {
        const loadCompanies = async () => {
            try {
                const res = await companyService.getCompanies();
                setCompanies(res.data);
            } catch (err) { }
        };
        loadCompanies();
    }, []);

    const currentCompanyId = localStorage.getItem('erp_company_id');
    const activeCompany = companies.find(c => c._id === currentCompanyId);

    const handleCreate = async (data) => {
        try {
            await createCustomer(data);
            setIsModalOpen(false);
        } catch (error) { }
    };

    const handleUpdate = async (data) => {
        try {
            await updateCustomer(data._id, data);
            setIsModalOpen(false);
        } catch (error) { }
    };

    const columns = [
        { label: 'Razón Social', key: 'name' },
        {
            label: 'Soberanía',
            key: 'company_id',
            render: (val) => {
                const company = companies.find(c => c._id === val);
                return (
                    <span style={{ 
                        fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', 
                        background: val ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: val ? '#3b82f6' : '#10b981',
                        border: `1px solid ${val ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                        fontWeight: 'bold'
                    }}>
                        {company ? company.name : 'GLOBAL'}
                    </span>
                );
            }
        },
        { 
            label: 'Documento', 
            key: 'document_number',
            render: (val, row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.65rem', background: '#334155', color: '#94a3b8', padding: '2px 4px', borderRadius: '4px', fontWeight: 'bold' }}>
                        {row.document_type || 'RUC'}
                    </span>
                    <span style={{ fontWeight: 'bold', color: 'white' }}>{val || row.ruc}</span>
                </div>
            )
        },
        {
            label: 'Estado Fiscal',
            key: 'sunat_state',
            align: 'center',
            render: (_, row) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                    <span style={{ 
                        fontSize: '0.65rem', 
                        padding: '2px 6px', 
                        borderRadius: '10px', 
                        background: row.sunat_state === 'ACTIVO' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: row.sunat_state === 'ACTIVO' ? '#10b981' : '#ef4444',
                        border: `1px solid ${row.sunat_state === 'ACTIVO' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                        fontWeight: 'bold'
                    }}>
                        {row.sunat_state || 'ACTIVO'}
                    </span>
                    <span style={{ 
                        fontSize: '0.6rem', 
                        padding: '1px 6px', 
                        borderRadius: '10px', 
                        background: row.sunat_condition === 'HABIDO' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        color: row.sunat_condition === 'HABIDO' ? '#3b82f6' : '#f59e0b',
                        fontWeight: '600'
                    }}>
                        {row.sunat_condition || 'HABIDO'}
                    </span>
                </div>
            )
        },
        { label: 'Teléfono', key: 'phone' },
        {
            label: 'Puntos Web',
            key: 'loyalty_points',
            align: 'center',
            render: (val) => <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{val || 0}</span>
        },
        {
            label: 'Puntos Local (Interno)',
            key: 'internal_points_local',
            align: 'center',
            render: (val) => <span style={{ color: '#94a3b8' }}>{val || 0}</span>
        },
        {
            label: 'Sucursales',
            key: 'branches',
            align: 'center',
            render: (val) => val?.length || 0
        },
        {
            label: 'Acciones',
            key: 'actions',
            align: 'center',
            render: (_, customer) => (
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <Button
                        size="small"
                        variant="secondary"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(customer);
                            setIsViewMode(true);
                            setIsModalOpen(true);
                        }}
                    >
                        Ver
                    </Button>
                    <Button
                        size="small"
                        variant="warning"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(customer);
                            setIsViewMode(false);
                            setIsModalOpen(true);
                        }}
                    >
                        Editar
                    </Button>
                    <Button
                        size="small"
                        variant="danger"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
                                deleteCustomer(customer._id);
                            }
                        }}
                    >
                        ✕
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ color: 'white', marginBottom: '0.5rem' }}>Gestión de Clientes</h1>
                    <p style={{ color: '#94a3b8' }}>Administración de clientes y sucursales</p>
                </div>
                <Button onClick={() => {
                    setSelectedCustomer(null);
                    setIsViewMode(false);
                    setIsModalOpen(true);
                }}>
                    + Nuevo Cliente
                </Button>
            </div>

            <Table
                columns={columns}
                data={customers}
                loading={loading}
                emptyMessage="No hay clientes registrados"
            />

            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{ backgroundColor: '#0f172a', borderRadius: '0.5rem', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ color: 'white', margin: 0 }}>
                                {isViewMode ? 'Detalle del Cliente' : (selectedCustomer ? 'Editar Cliente' : 'Nuevo Cliente')}
                                {!selectedCustomer && !isViewMode && (
                                    <span style={{ fontSize: '0.7rem', color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 10px', borderRadius: '10px', marginLeft: '1rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                        Contexto: {activeCompany ? activeCompany.name : 'GLOBAL / HOLDING'}
                                    </span>
                                )}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>

                        {isViewMode ? (
                            <div style={{ padding: '1.5rem' }}>
                                <p><strong>Razón Social:</strong> {selectedCustomer.name}</p>
                                <p><strong>Documento:</strong> <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginRight: '5px' }}>({selectedCustomer.document_type || 'RUC'})</span> {selectedCustomer.document_number || selectedCustomer.ruc}</p>
                                <p><strong>Email:</strong> {selectedCustomer.email}</p>
                                <p><strong>Teléfono:</strong> {selectedCustomer.phone}</p>
                                <p><strong>Dirección Principal:</strong> {selectedCustomer.address}</p>
                                <p><strong>Clasificación:</strong> <span style={{
                                    background: selectedCustomer.classification === 'ORO' ? '#fef3c7' : '#f1f5f9',
                                    color: selectedCustomer.classification === 'ORO' ? '#92400e' : '#475569',
                                    padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold'
                                }}>{selectedCustomer.classification || 'STANDARD'}</span></p>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', padding: '1rem', background: '#0f172a', borderRadius: '8px' }}>
                                    <p style={{ margin: 0 }}><strong>Lista de Precios:</strong> <span style={{ color: '#3b82f6' }}>{selectedCustomer.price_list_id || 'Automático'}</span></p>
                                    <p style={{ margin: 0 }}><strong>Moneda:</strong> <span style={{ color: '#10b981' }}>{selectedCustomer.currency_preference || 'PEN'}</span></p>
                                    <p style={{ margin: 0 }}><strong>Vendedor:</strong> {selectedCustomer.seller_id || 'No asignado'}</p>
                                    <p style={{ margin: 0 }}><strong>Pago habitual:</strong> {selectedCustomer.payment_method_id || 'No especificado'}</p>
                                </div>

                                {/* --- SECCIÓN FISCAL (SUNAT) --- */}
                                <div style={{ 
                                    marginTop: '1.5rem', 
                                    padding: '1rem', 
                                    background: 'rgba(59, 130, 246, 0.05)', 
                                    borderRadius: '12px', 
                                    border: '1px solid rgba(59, 130, 246, 0.2)' 
                                }}>
                                    <h4 style={{ color: '#3b82f6', margin: '0 0 1rem 0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        🛡️ Información Fiscal (SUNAT)
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                                        <div>
                                            <p style={{ margin: '0 0 0.5rem 0' }}><strong>Estado:</strong> <span style={{ color: selectedCustomer.sunat_state === 'ACTIVO' ? '#10b981' : '#ef4444' }}>{selectedCustomer.sunat_state}</span></p>
                                            <p style={{ margin: 0 }}><strong>Condición:</strong> <span style={{ color: selectedCustomer.sunat_condition === 'HABIDO' ? '#3b82f6' : '#f59e0b' }}>{selectedCustomer.sunat_condition}</span></p>
                                        </div>
                                        <div>
                                            <p style={{ margin: '0 0 0.5rem 0' }}><strong>Ag. Retención:</strong> {selectedCustomer.is_retention_agent ? '✅ SI' : '❌ NO'}</p>
                                            <p style={{ margin: 0 }}><strong>Ag. Percepción:</strong> {selectedCustomer.is_perception_agent ? '✅ SI' : '❌ NO'}</p>
                                        </div>
                                    </div>
                                    {selectedCustomer.main_activity && (
                                        <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
                                            <strong>Actividad:</strong> {selectedCustomer.main_activity}
                                        </p>
                                    )}
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '1rem',
                                    marginTop: '1.5rem',
                                    padding: '1rem',
                                    background: '#1e293b',
                                    borderRadius: '8px',
                                    border: '1px solid #334155'
                                }}>
                                    <div>
                                        <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Puntos Web (Visibles al Cliente)</p>
                                        <p style={{ color: '#3b82f6', fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{selectedCustomer.loyalty_points || 0}</p>
                                    </div>
                                    <div>
                                        <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Puntos Local (Internos)</p>
                                        <p style={{ color: '#a855f7', fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{selectedCustomer.internal_points_local || 0}</p>
                                    </div>
                                </div>

                                {/* --- PANEL FINANCIERO DE CLASE MUNDIAL --- */}
                                <div style={{ marginTop: '2rem', borderTop: '1px solid #334155', paddingTop: '1.5rem' }}>
                                    <CustomerFinancialStatus documentNumber={selectedCustomer.document_number} />
                                </div>

                                {selectedCustomer.linked_user_id && selectedCustomer.internal_points_local > 0 && (
                                    <div style={{ marginTop: '1rem', padding: '1rem', background: '#0f172a', borderRadius: '8px', border: '1px border-dashed #334155' }}>
                                        <h4 style={{ color: '#e2e8f0', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Convertir Puntos Locales a Web</h4>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                                            <div style={{ flex: 1 }}>
                                                <Input
                                                    label="Cantidad a convertir"
                                                    type="number"
                                                    value={pointsToConvert}
                                                    onChange={(e) => setPointsToConvert(parseInt(e.target.value) || 0)}
                                                    max={selectedCustomer.internal_points_local}
                                                />
                                            </div>
                                            <Button
                                                variant="success"
                                                size="small"
                                                onClick={async () => {
                                                    if (pointsToConvert <= 0 || pointsToConvert > selectedCustomer.internal_points_local) {
                                                        showNotification("Cantidad inválida", "warning");
                                                        return;
                                                    }
                                                    setConverting(true);
                                                    try {
                                                        await marketingService.convertPoints({
                                                            user_id: selectedCustomer.linked_user_id,
                                                            points_to_convert: pointsToConvert
                                                        });
                                                        showNotification("Puntos convertidos con éxito", "success");
                                                        setPointsToConvert(0);
                                                        await fetchCustomers();
                                                        setIsModalOpen(false);
                                                    } catch (error) {
                                                        showNotification("Error al convertir puntos", "error");
                                                    } finally {
                                                        setConverting(false);
                                                    }
                                                }}
                                                loading={converting}
                                            >
                                                Convertir
                                            </Button>
                                        </div>
                                        <p style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '0.5rem' }}>
                                            * Esta acción es irreversible. Se aplicará la tasa de conversión definida en Marketing.
                                        </p>
                                    </div>
                                )}

                                {selectedCustomer.branches && selectedCustomer.branches.length > 0 && (
                                    <div style={{ marginTop: '1.5rem' }}>
                                        <h4 style={{ color: '#e2e8f0', marginBottom: '0.5rem' }}>Sucursales:</h4>
                                        {selectedCustomer.branches.map((branch, index) => (
                                            <div key={index} style={{
                                                padding: '0.75rem',
                                                background: '#1e293b',
                                                borderRadius: '6px',
                                                marginBottom: '0.5rem',
                                                border: branch.is_main ? '2px solid #3b82f6' : 'none'
                                            }}>
                                                <strong style={{ color: 'white' }}>{branch.branch_name}</strong>
                                                {branch.is_main && <span style={{ color: '#3b82f6', marginLeft: '0.5rem' }}>(Principal)</span>}
                                                <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: '0.25rem 0' }}>{branch.address}</p>
                                                {branch.contact_person && <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>Contacto: {branch.contact_person} {branch.phone && `- ${branch.phone}`}</p>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <CustomerForm
                                initialData={selectedCustomer}
                                onSubmit={selectedCustomer ? handleUpdate : handleCreate}
                                onCancel={() => setIsModalOpen(false)}
                                loading={loading}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
