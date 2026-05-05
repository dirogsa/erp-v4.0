import React, { useState } from 'react';
import { useCompany } from '../context/CompanyContext';
import { companyService, staffService } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import { useQuery } from '@tanstack/react-query';
import Button from '../components/common/Button';
import Table from '../components/common/Table';

const Companies = () => {
    const { companies, activeCompany, switchCompany, refreshCompanies } = useCompany();
    const { showNotification } = useNotification();
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);
    
    const [formData, setFormData] = useState({
        name: '', ruc: '', address: '', phone: '', email: '',
        bank_name: '', account_soles: '', account_dollars: '',
        functional_currency: 'PEN',
        tax_percentage: 18.0,
        cost_method: 'PEPS',
        enterprise_settings: {
            warehouse_group_id: 'DEFAULT',
            transfer_price_margin_pct: 0,
            allow_cross_company_sales: true,
            auto_intercompany_settlement: true
        },
        departments: []
    });

    const { data: staff = [] } = useQuery({
        queryKey: ['staff', 'active'],
        queryFn: () => staffService.getStaff({ active_only: true }).then(res => res.data),
        enabled: isModalOpen
    });

    const handleOpenModal = (company = null) => {
        setEditingCompany(company);
        setFormData(company || {
            name: '', ruc: '', address: '', phone: '', email: '',
            bank_name: '', account_soles: '', account_dollars: '',
            functional_currency: 'PEN',
            tax_percentage: 18.0,
            cost_method: 'PEPS',
            enterprise_settings: {
                warehouse_group_id: 'DEFAULT',
                transfer_price_margin_pct: 0,
                allow_cross_company_sales: true,
                auto_intercompany_settlement: true
            },
            departments: []
        });
        setIsModalOpen(true);
    };

    const handleDeptChange = (index, field, value) => {
        const newDepts = [...(formData.departments || [])];
        newDepts[index][field] = value;
        setFormData({ ...formData, departments: newDepts });
    };

    const addDept = () => {
        setFormData({
            ...formData,
            departments: [...(formData.departments || []), { name: '', staff_id: '' }]
        });
    };

    const removeDept = (index) => {
        const newDepts = formData.departments.filter((_, i) => i !== index);
        setFormData({ ...formData, departments: newDepts });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingCompany) {
                await companyService.updateCompany(editingCompany._id, formData);
                showNotification('Empresa actualizada', 'success');
            } else {
                await companyService.createCompany(formData);
                showNotification('Empresa creada', 'success');
            }
            await refreshCompanies();
            setIsModalOpen(false);
        } catch (error) {
            showNotification(error.response?.data?.detail || 'Error al guardar empresa', 'error');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            label: 'Entorno Local',
            key: 'is_active_local',
            render: (_, row) => row.is_active_local ? (
                <div className="status-indicator active">
                    <span className="dot pulse"></span>
                    <span className="label">CONECTADO AL ERP</span>
                </div>
            ) : (
                <button className="activate-btn" onClick={() => switchCompany(row._id, 'local')}>
                    🔌 Conectar ERP
                </button>
            )
        },
        {
            label: 'Entorno Web (E-commerce)',
            key: 'is_active_web',
            render: (_, row) => row.is_active_web ? (
                <div className="status-indicator web">
                    <span className="dot pulse-green"></span>
                    <span className="label">TIENDA ONLINE EN VIVO</span>
                </div>
            ) : (
                <button className="activate-btn secondary" onClick={() => switchCompany(row._id, 'web')}>
                    🌐 Publicar en Web
                </button>
            )
        },
        { label: 'Razón Social', key: 'name' },
        { label: 'Moneda', key: 'functional_currency', render: (val) => val === 'USD' ? '🇺🇸 USD' : '🇵🇪 PEN' },
        { label: 'RUC', key: 'ruc' },
        {
            label: 'Acciones',
            key: 'actions',
            render: (_, row) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button size="small" variant="info" onClick={() => handleOpenModal(row)}>Editar</Button>
                </div>
            )
        }
    ];

    return (
        <div className="companies-container">
            <header className="page-header">
                <div>
                    <h1>Gestión de Empresas</h1>
                    <p className="subtitle">Administra las entidades legales y configuraciones corporativas</p>
                </div>
                <Button onClick={() => handleOpenModal()} variant="primary">+ Nueva Empresa</Button>
            </header>

            <div className="table-wrapper">
                <Table
                    columns={columns}
                    data={companies}
                    emptyMessage="No hay empresas registradas"
                />
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modern-modal">
                        <header className="modal-header">
                            <h2>{editingCompany ? 'Editar Empresa' : 'Registro de Nueva Empresa'}</h2>
                            <button className="close-x" onClick={() => setIsModalOpen(false)}>×</button>
                        </header>
                        
                        <form onSubmit={handleSubmit} className="modal-body">
                            {/* SECCIÓN 1: IDENTIDAD */}
                            <div className="form-section">
                                <h3 className="section-title">📍 Identidad y Moneda</h3>
                                <div className="grid-2">
                                    <div className="field">
                                        <label>Razón Social *</label>
                                        <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nombre Legal" />
                                    </div>
                                    <div className="field">
                                        <label>RUC *</label>
                                        <input required value={formData.ruc} onChange={e => setFormData({ ...formData, ruc: e.target.value })} placeholder="Número de RUC" />
                                    </div>
                                    <div className="field">
                                        <label>Moneda Operativa *</label>
                                        <select value={formData.functional_currency} onChange={e => setFormData({ ...formData, functional_currency: e.target.value })}>
                                            <option value="PEN">🇵🇪 Soles (PEN)</option>
                                            <option value="USD">🇺🇸 Dólares (USD)</option>
                                        </select>
                                    </div>
                                    <div className="field">
                                        <label>Teléfono</label>
                                        <input value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+51 ..." />
                                    </div>
                                    <div className="field full">
                                        <label>Dirección Fiscal</label>
                                        <input value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Av. Principal 123..." />
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN 2: FINANZAS */}
                            <div className="form-section">
                                <h3 className="section-title">💳 Información Bancaria</h3>
                                <div className="grid-2">
                                    <div className="field">
                                        <label>Nombre del Banco</label>
                                        <input value={formData.bank_name || ''} onChange={e => setFormData({ ...formData, bank_name: e.target.value })} />
                                    </div>
                                    <div className="field">
                                        <label>Correo Cobranzas</label>
                                        <input type="email" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                    <div className="field">
                                        <label>Cuenta Soles</label>
                                        <input value={formData.account_soles || ''} onChange={e => setFormData({ ...formData, account_soles: e.target.value })} />
                                    </div>
                                    <div className="field">
                                        <label>Cuenta Dólares</label>
                                        <input value={formData.account_dollars || ''} onChange={e => setFormData({ ...formData, account_dollars: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN 3: GOBERNANZA */}
                            <div className="form-section highlight">
                                <h3 className="section-title">⚙️ Configuración Corporativa (Catálogo)</h3>
                                <div className="grid-2">
                                    <div className="field">
                                        <label>Tasa de Impuesto (IGV %)</label>
                                        <input type="number" step="0.01" value={formData.tax_percentage} onChange={e => setFormData({ ...formData, tax_percentage: parseFloat(e.target.value) })} />
                                    </div>
                                    <div className="field">
                                        <label>Método de Valoración (Costeo)</label>
                                        <select value={formData.cost_method} onChange={e => setFormData({ ...formData, cost_method: e.target.value })}>
                                            <option value="PEPS">PEPS (Primeras Entradas, Primeras Salidas)</option>
                                            <option value="PROMEDIO">Promedio Ponderado</option>
                                            <option value="UEPS">UEPS (Últimas Entradas, Primeras Salidas)</option>
                                        </select>
                                    </div>
                                    <div className="field">
                                        <label>Grupo de Almacén</label>
                                        <input value={formData.enterprise_settings?.warehouse_group_id || 'DEFAULT'} onChange={e => setFormData({ ...formData, enterprise_settings: { ...formData.enterprise_settings, warehouse_group_id: e.target.value } })} />
                                    </div>
                                    <div className="field">
                                        <label>Margen Traspaso (%)</label>
                                        <input type="number" value={formData.enterprise_settings?.transfer_price_margin_pct || 0} onChange={e => setFormData({ ...formData, enterprise_settings: { ...formData.enterprise_settings, transfer_price_margin_pct: parseFloat(e.target.value) } })} />
                                    </div>
                                    <div className="checkbox-field">
                                        <input type="checkbox" checked={formData.enterprise_settings?.allow_cross_company_sales ?? true} onChange={e => setFormData({ ...formData, enterprise_settings: { ...formData.enterprise_settings, allow_cross_company_sales: e.target.checked } })} />
                                        <label>Ventas Cruzadas</label>
                                    </div>
                                    <div className="checkbox-field">
                                        <input type="checkbox" checked={formData.enterprise_settings?.auto_intercompany_settlement ?? true} onChange={e => setFormData({ ...formData, enterprise_settings: { ...formData.enterprise_settings, auto_intercompany_settlement: e.target.checked } })} />
                                        <label>Deudas Automáticas</label>
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN 4: ÁREAS */}
                            <div className="form-section">
                                <header className="section-header">
                                    <h3 className="section-title">👥 Áreas y Encargados</h3>
                                    <Button type="button" size="small" onClick={addDept}>+ Añadir</Button>
                                </header>
                                <div className="dept-list">
                                    {(formData.departments || []).map((dept, index) => (
                                        <div key={index} className="dept-item">
                                            <input value={dept.name} onChange={e => handleDeptChange(index, 'name', e.target.value)} placeholder="Área" required />
                                            <select value={dept.staff_id || ''} onChange={e => handleDeptChange(index, 'staff_id', e.target.value)} required>
                                                <option value="">-- Encargado --</option>
                                                {staff.map(s => <option key={s._id} value={s._id}>{s.full_name}</option>)}
                                            </select>
                                            <button type="button" className="del-btn" onClick={() => removeDept(index)}>✕</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </form>

                        <footer className="modal-footer">
                            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button variant="primary" onClick={handleSubmit} disabled={loading}>{loading ? 'Guardando...' : '💾 Guardar Empresa'}</Button>
                        </footer>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                .companies-container { padding: 30px; max-width: 1200px; margin: 0 auto; color: #e2e8f0; }
                .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                .page-header h1 { margin: 0; font-size: 2rem; font-weight: 800; }
                .subtitle { color: #94a3b8; margin: 5px 0 0 0; }
                
                .modern-modal {
                    background: #0f172a;
                    width: 90%;
                    max-width: 800px;
                    border-radius: 16px;
                    display: flex;
                    flex-direction: column;
                    max-height: 90vh;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    border: 1px solid #1e293b;
                }
                
                .modal-header { padding: 20px 24px; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; }
                .modal-header h2 { margin: 0; font-size: 1.25rem; }
                .close-x { background: none; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer; }
                
                .modal-body { padding: 24px; overflow-y: auto; flex: 1; }
                .form-section { margin-bottom: 30px; }
                .section-title { font-size: 0.9rem; color: #3b82f6; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; border-bottom: 1px solid #1e293b; padding-bottom: 8px; }
                
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                .field { display: flex; flex-direction: column; gap: 6px; }
                .field.full { grid-column: span 2; }
                .field label { font-size: 0.8rem; font-weight: 600; color: #94a3b8; }
                .field input, .field select { background: #1e293b; border: 1px solid #334155; padding: 10px; border-radius: 8px; color: white; }
                
                .checkbox-field { display: flex; align-items: center; gap: 10px; padding-top: 25px; }
                .checkbox-field label { font-size: 0.9rem; margin: 0; }
                
                .highlight { background: #1e293b50; padding: 15px; border-radius: 12px; border: 1px solid #3b82f630; }
                
                .dept-list { display: flex; flex-direction: column; gap: 10px; }
                .dept-item { display: grid; grid-template-columns: 1fr 1fr auto; gap: 10px; align-items: center; }
                .dept-item input, .dept-item select { background: #0f172a; border: 1px solid #334155; padding: 8px; border-radius: 6px; color: white; }
                .del-btn { background: #ef444420; border: 1px solid #ef444450; color: #ef4444; width: 30px; height: 30px; border-radius: 6px; cursor: pointer; }
                
                .modal-footer { padding: 20px 24px; border-top: 1px solid #1e293b; display: flex; justify-content: flex-end; gap: 12px; }
                
                .status-badge { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
                .status-badge.active { background: #3b82f620; color: #3b82f6; border: 1px solid #3b82f650; }

                .status-indicator {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 6px 12px;
                    background: rgba(30, 41, 59, 0.5);
                    border-radius: 8px;
                    border: 1px solid transparent;
                }
                .status-indicator.active { border-color: #3b82f650; background: rgba(59, 130, 246, 0.1); }
                .status-indicator.web { border-color: #10b98150; background: rgba(16, 185, 129, 0.1); }

                .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
                .dot.pulse { background: #3b82f6; box-shadow: 0 0 0 rgba(59, 130, 246, 0.4); animation: pulse-blue 2s infinite; }
                .dot.pulse-green { background: #10b981; box-shadow: 0 0 0 rgba(16, 185, 129, 0.4); animation: pulse-green 2s infinite; }

                .label { font-size: 0.7rem; font-weight: 800; letter-spacing: 0.5px; }
                .status-indicator.active .label { color: #60a5fa; }
                .status-indicator.web .label { color: #34d399; }

                .activate-btn {
                    background: transparent;
                    border: 1px dashed #475569;
                    color: #94a3b8;
                    padding: 6px 12px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.75rem;
                    font-weight: 600;
                    transition: all 0.2s;
                }
                .activate-btn:hover { border-color: #3b82f6; color: #3b82f6; background: rgba(59, 130, 246, 0.05); }
                .activate-btn.secondary:hover { border-color: #10b981; color: #10b981; background: rgba(16, 185, 129, 0.05); }

                @keyframes pulse-blue {
                    0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
                }
                @keyframes pulse-green {
                    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                }
            `}} />
        </div>
    );
};

export default Companies;
