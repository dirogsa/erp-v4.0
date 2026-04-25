import React, { useState, useEffect } from 'react';
import { pricingService } from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useNotification } from '../hooks/useNotification';

const PricingLists = () => {
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingList, setEditingList] = useState(null);
    const { showNotification } = useNotification();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: '#6366f1',
        is_campaign: false,
        start_date: '',
        end_date: '',
        priority: 0
    });

    useEffect(() => {
        fetchLists();
    }, []);

    const fetchLists = async () => {
        try {
            const res = await pricingService.getLists();
            setLists(res.data);
        } catch (error) {
            showNotification('Error al cargar listas', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (list) => {
        setEditingList(list);
        setFormData({
            name: list.name,
            description: list.description || '',
            color: list.color || '#6366f1',
            is_campaign: list.is_campaign,
            start_date: list.start_date ? list.start_date.split('T')[0] : '',
            end_date: list.end_date ? list.end_date.split('T')[0] : '',
            priority: list.priority || 0
        });
        setShowModal(true);
    };

    const handleDeleteClick = async (list) => {
        if (list.name === 'General') {
            showNotification('La lista General es obligatoria y no se puede borrar', 'warning');
            return;
        }

        if (window.confirm(`¿Estás seguro de que deseas eliminar la lista "${list.name}"? Se borrarán todos los precios asociados.`)) {
            try {
                await pricingService.deleteList(list.id);
                showNotification('Lista eliminada correctamente', 'success');
                fetchLists();
            } catch (error) {
                showNotification('Error al eliminar la lista', 'error');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.is_campaign && (!formData.start_date || !formData.end_date)) {
            showNotification('Las campañas requieren fecha de inicio y fin', 'warning');
            return;
        }

        try {
            const cleanData = {
                ...formData,
                start_date: formData.start_date || null,
                end_date: formData.end_date || null
            };
            
            if (editingList) {
                // Para simplificar usaremos el mismo createList que actúa como upsert en el backend si el nombre coincide
                // o actualizaremos vía API específica
                await pricingService.createList(cleanData);
                showNotification('Lista actualizada con éxito', 'success');
            } else {
                await pricingService.createList(cleanData);
                showNotification('Lista creada con éxito', 'success');
            }
            
            setShowModal(false);
            resetForm();
            fetchLists();
        } catch (error) {
            showNotification('Error al procesar la lista', 'error');
        }
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', color: '#6366f1', is_campaign: false, start_date: '', end_date: '', priority: 0 });
        setEditingList(null);
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Listas y Campañas Maestras</h2>
                    <p style={{ color: '#94a3b8' }}>Segmentación estratégica de precios para el mercado global.</p>
                </div>
                <Button onClick={() => { resetForm(); setShowModal(true); }} variant="primary">+ Nueva Lista/Campaña</Button>
            </div>

            {loading ? (
                <div style={{ color: '#94a3b8', textAlign: 'center', padding: '3rem' }}>Sincronizando con el servidor...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {lists.map(list => (
                        <div key={list.id} style={{
                            background: 'rgba(30, 41, 59, 0.4)',
                            backdropFilter: 'blur(12px)',
                            border: `1px solid ${list.is_campaign ? list.color : 'rgba(255,255,255,0.05)'}`,
                            borderRadius: '1.25rem',
                            padding: '1.75rem',
                            position: 'relative',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            overflow: 'hidden'
                        }}>
                            {list.is_campaign && (
                                <div style={{
                                    position: 'absolute', top: '1rem', right: '-2rem',
                                    background: list.color, color: 'white', padding: '0.25rem 3rem',
                                    transform: 'rotate(45deg)', fontSize: '0.7rem', fontWeight: '900'
                                }}>PROMO</div>
                            )}

                            <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => handleEditClick(list)} style={{ background: 'rgba(59, 130, 246, 0.1)', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '0.4rem', borderRadius: '0.5rem' }}>✏️</button>
                                {list.name !== 'General' && (
                                    <button onClick={() => handleDeleteClick(list)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.4rem', borderRadius: '0.5rem' }}>🗑️</button>
                                )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: list.color, boxShadow: `0 0 10px ${list.color}` }} />
                                <h3 style={{ color: 'white', margin: 0, fontWeight: '800' }}>{list.name}</h3>
                            </div>
                            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem', minHeight: '3rem' }}>{list.description || 'Sin descripción estratégica.'}</p>
                            
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b' }}>
                                <div>Prioridad <span style={{ color: 'white', fontWeight: 'bold' }}>{list.priority}</span></div>
                                <div style={{ 
                                    padding: '0.25rem 0.6rem', background: list.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                                    borderRadius: '99px', color: list.is_active ? '#10b981' : '#ef4444', fontWeight: 'bold'
                                }}>
                                    {list.is_active ? 'ACTIVA' : 'INACTIVA'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
                    backdropFilter: 'blur(8px)'
                }}>
                    <form onSubmit={handleSubmit} style={{
                        background: '#0f172a', padding: '2.5rem', borderRadius: '2rem', width: '100%', maxWidth: '550px',
                        border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                        animation: 'scaleIn 0.3s ease-out'
                    }}>
                        <h2 style={{ color: 'white', marginBottom: '2rem', fontSize: '1.75rem', fontWeight: '900' }}>
                            {editingList ? 'Editar Lista' : 'Configurar Lista'}
                        </h2>
                        
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            <Input label="Nombre de la Lista" required disabled={editingList?.name === 'General'} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Descripción Estratégica</label>
                                <textarea 
                                    placeholder="Escribe aquí el propósito de esta lista..." 
                                    value={formData.description} 
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                    style={{
                                        width: '100%',
                                        minHeight: '80px',
                                        background: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '0.75rem',
                                        padding: '0.75rem',
                                        color: 'white',
                                        fontSize: '0.9rem',
                                        resize: 'none',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                    onBlur={(e) => e.target.style.borderColor = '#334155'}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                <div>
                                    <Input label="Color Identificador" type="color" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
                                    <p style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '0.4rem' }}>🎨 Ayuda a identificar visualmente las tarjetas de esta lista.</p>
                                </div>
                                <div>
                                    <Input label="Prioridad" type="number" value={formData.priority} onChange={e => setFormData({...formData, priority: parseInt(e.target.value)})} />
                                    <p style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '0.4rem' }}>⚖️ El número más alto gana. Determina qué precio mostrar si el producto está en varias listas.</p>
                                </div>
                            </div>

                            <div style={{ 
                                padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <label style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginBottom: '1.25rem', fontWeight: '700' }}>
                                    <input type="checkbox" style={{ width: '18px', height: '18px' }} checked={formData.is_campaign} onChange={e => setFormData({...formData, is_campaign: e.target.checked})} />
                                    ¿Es una Campaña Programada?
                                </label>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <Input label="Fecha Inicio" type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                                    <Input label="Fecha Fin" type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1.25rem', marginTop: '2.5rem' }}>
                            <Button type="button" variant="outline" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cerrar</Button>
                            <Button type="submit" variant="primary" style={{ flex: 1 }}>
                                {editingList ? 'Guardar Cambios' : 'Crear Lista Maestra'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default PricingLists;
