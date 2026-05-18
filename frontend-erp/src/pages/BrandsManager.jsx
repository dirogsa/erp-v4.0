import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productBrandService, brandService } from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useNotification } from '../hooks/useNotification';

const BrandsManager = () => {
    const navigate = useNavigate();
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState({ progress: 0, total: 0, current_step: '', is_running: false });
    const [showModal, setShowModal] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const { showNotification } = useNotification();
    const [formData, setFormData] = useState({
        name: '',
        aliases_str: '',
        description: '',
        is_active: true
    });

    useEffect(() => {
        fetchBrands();
        checkSyncStatus();
    }, []);

    // Polling logic for Sync
    useEffect(() => {
        let interval;
        if (syncing) {
            interval = setInterval(checkSyncStatus, 2000);
        }
        return () => clearInterval(interval);
    }, [syncing]);

    const checkSyncStatus = async () => {
        try {
            const res = await brandService.getSyncStatus();
            setSyncProgress(res.data);
            
            if (res.data.is_running) {
                setSyncing(true);
            } else if (syncing) {
                // Sincronización ha concluido
                setSyncing(false);
                showNotification(res.data.last_result || 'Sincronización finalizada con éxito', 'success');
                fetchBrands();
            }
        } catch (error) {
            console.error("Error al obtener estado de sincronización", error);
        }
    };

    const handleSync = async () => {
        if (!window.confirm('¿Deseas iniciar la sincronización masiva? Este proceso indexará todas las marcas de vehículos y compilará en caliente el caché local de fabricantes.')) return;
        try {
            await brandService.syncBrands();
            setSyncing(true);
            showNotification('Sincronización masiva de marcas iniciada', 'info');
        } catch (error) {
            showNotification('Error al iniciar la sincronización', 'error');
        }
    };

    const fetchBrands = async () => {
        try {
            setLoading(true);
            const res = await productBrandService.getBrands(true);
            setBrands(res.data);
        } catch (error) {
            showNotification('Error al cargar las marcas maestras', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (brand) => {
        setEditingBrand(brand);
        setFormData({
            name: brand.name,
            aliases_str: brand.aliases ? brand.aliases.join(', ') : '',
            description: brand.description || '',
            is_active: brand.is_active
        });
        setShowModal(true);
    };

    const handleDeleteClick = async (brand) => {
        if (window.confirm(`¿Estás seguro de eliminar la marca "${brand.name}"? Esto afectará la inteligencia de importación XML.`)) {
            try {
                await productBrandService.deleteBrand(brand.id || brand._id);
                showNotification('Marca eliminada del catálogo maestro', 'success');
                fetchBrands();
            } catch (error) {
                showNotification('Error al eliminar la marca', 'error');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Convert comma-separated string to array
        const aliases = formData.aliases_str.split(',')
            .map(a => a.trim())
            .filter(a => a !== '');

        const payload = {
            name: formData.name,
            aliases: aliases,
            description: formData.description,
            is_active: formData.is_active
        };

        try {
            if (editingBrand) {
                await productBrandService.updateBrand(editingBrand.id || editingBrand._id, payload);
                showNotification('Catálogo maestro actualizado', 'success');
            } else {
                await productBrandService.createBrand(payload);
                showNotification('Nueva marca registrada con éxito', 'success');
            }
            setShowModal(false);
            resetForm();
            fetchBrands();
        } catch (error) {
            showNotification('Error al procesar la marca', 'error');
        }
    };

    const resetForm = () => {
        setFormData({ name: '', aliases_str: '', description: '', is_active: true });
        setEditingBrand(null);
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h2 style={{ color: 'white', fontSize: '1.75rem', marginBottom: '0.5rem', fontWeight: '900' }}>Maestro de Marcas (MDM)</h2>
                    <p style={{ color: '#94a3b8' }}>Gestiona la inteligencia semántica para el reconocimiento automático de marcas en XML.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Button onClick={() => navigate('/financial-sincerity')} variant="outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        ⚖️ Volver al Buzón Fiscal
                    </Button>
                    <Button onClick={handleSync} variant="outline" style={{ borderColor: '#f59e0b', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {syncing ? '🔄 Sincronizando...' : '⚡ Sincronizar Catálogo'}
                    </Button>
                    <Button onClick={() => { resetForm(); setShowModal(true); }} variant="primary">+ Nueva Marca Maestra</Button>
                </div>
            </div>

            {syncing && (
                <div style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    padding: '1.5rem',
                    borderRadius: '1.5rem',
                    marginBottom: '2.5rem',
                    color: '#fbbf24',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    animation: 'pulse 2s infinite ease-in-out'
                }}>
                    <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem' }}>
                        <span>🔄 Sincronización Masiva en Progreso:</span>
                        <span style={{ color: 'white' }}>{syncProgress.current_step || 'Actualizando catálogos...'}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.5' }}>
                        El backend está compilando las marcas de vehículos y actualizando en caliente el catálogo maestro local de marcas de autopartes. Puedes continuar usando la suite con total libertad mientras esto concluye.
                    </p>
                </div>
            )}

            {loading ? (
                <div style={{ color: '#94a3b8', textAlign: 'center', padding: '5rem' }}>Sincronizando catálogo con la nube...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    {brands.map((brand, index) => (
                        <div key={brand.id || brand._id || index} style={{
                            background: 'rgba(30, 41, 59, 0.4)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '1.5rem',
                            padding: '2rem',
                            position: 'relative',
                            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }} className="hover-card">
                            <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => handleEditClick(brand)} style={{ background: 'rgba(59, 130, 246, 0.1)', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.75rem' }}>✏️</button>
                                <button onClick={() => handleDeleteClick(brand)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.75rem' }}>🗑️</button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                                <div style={{ 
                                    width: '48px', height: '48px', borderRadius: '1rem', 
                                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', fontWeight: 'bold', fontSize: '1.2rem'
                                }}>
                                    {(brand.name || '').substring(0, 1)}
                                </div>
                                <div>
                                    <h3 style={{ color: 'white', margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>{brand.name}</h3>
                                    <div style={{ color: brand.is_active ? '#10b981' : '#ef4444', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                        {brand.is_active ? '● Activa' : '○ Inactiva'}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Alias de Reconocimiento</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                    {brand.aliases && brand.aliases.length > 0 ? brand.aliases.map((alias, idx) => (
                                        <span key={idx} style={{ 
                                            background: 'rgba(255,255,255,0.05)', color: '#94a3b8', 
                                            padding: '0.2rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.75rem',
                                            border: '1px solid rgba(255,255,255,0.03)'
                                        }}>
                                            {alias}
                                        </span>
                                    )) : <span style={{ color: '#475569', fontSize: '0.75rem', fontStyle: 'italic' }}>Sin alias configurados</span>}
                                </div>
                            </div>

                            <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
                                {brand.description || 'Sin descripción estratégica registrada.'}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
                    backdropFilter: 'blur(10px)'
                }}>
                    <form onSubmit={handleSubmit} style={{
                        background: '#0f172a', padding: '3rem', borderRadius: '2.5rem', width: '100%', maxWidth: '600px',
                        border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                        animation: 'scaleIn 0.3s ease-out'
                    }}>
                        <h2 style={{ color: 'white', marginBottom: '2rem', fontSize: '2rem', fontWeight: '900' }}>
                            {editingBrand ? 'Editar Marca' : 'Registrar Marca'}
                        </h2>
                        
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            <Input label="Nombre Principal de la Marca" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />
                            
                            <div>
                                <label style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Alias de Importación (Separados por coma)</label>
                                <textarea 
                                    placeholder="Ej: MANN, MANN-FILTER, MANN+HUMMEL" 
                                    value={formData.aliases_str} 
                                    onChange={e => setFormData({...formData, aliases_str: e.target.value})}
                                    style={{
                                        width: '100%', minHeight: '80px', background: '#1e293b', border: '1px solid #334155',
                                        borderRadius: '1rem', padding: '1rem', color: 'white', fontSize: '0.9rem', resize: 'none', outline: 'none'
                                    }}
                                />
                                <p style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '0.5rem' }}>
                                    💡 Estos son los términos que el sistema buscará dentro de las descripciones del XML.
                                </p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Notas / Descripción</label>
                                <textarea 
                                    value={formData.description} 
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                    style={{
                                        width: '100%', minHeight: '60px', background: '#1e293b', border: '1px solid #334155',
                                        borderRadius: '1rem', padding: '1rem', color: 'white', fontSize: '0.9rem', resize: 'none', outline: 'none'
                                    }}
                                />
                            </div>

                            <label style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontWeight: '600' }}>
                                <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                                ¿Marca Activa para Inteligencia Semántica?
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: '1.25rem', marginTop: '2.5rem' }}>
                            <Button type="button" variant="outline" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancelar</Button>
                            <Button type="submit" variant="primary" style={{ flex: 1 }}>
                                {editingBrand ? 'Guardar Cambios' : 'Registrar en Maestro'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default BrandsManager;
