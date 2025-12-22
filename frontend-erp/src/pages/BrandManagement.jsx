import React, { useState, useEffect } from 'react';
import { brandService } from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/Modal';
import { useNotification } from '../hooks/useNotification';

const BrandManagement = () => {
    const { showNotification } = useNotification();
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        origin: 'OTHER',
        logo_url: '',
        is_popular: false
    });

    useEffect(() => {
        loadBrands();
    }, []);

    const loadBrands = async () => {
        setLoading(true);
        try {
            const res = await brandService.getBrands();
            setBrands(res.data);
        } catch (error) {
            showNotification('Error cargando marcas', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        if (!window.confirm('¿Deseas escanear el catálogo para encontrar nuevas marcas de vehículos?')) return;
        setLoading(true);
        try {
            const res = await brandService.syncBrands();
            showNotification(res.data.message, 'success');
            loadBrands();
        } catch (error) {
            showNotification('Error en la sincronización', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (brand) => {
        setEditingBrand(brand);
        setFormData({
            name: brand.name,
            origin: brand.origin,
            logo_url: brand.logo_url || '',
            is_popular: brand.is_popular || false
        });
        setModalVisible(true);
    };

    const handleDelete = async (name) => {
        if (!window.confirm(`¿Seguro que deseas eliminar la marca ${name}?`)) return;
        try {
            await brandService.deleteBrand(name);
            showNotification('Marca eliminada', 'success');
            loadBrands();
        } catch (error) {
            showNotification('Error al eliminar', 'error');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await brandService.updateBrand(editingBrand.name, formData);
            showNotification('Marca actualizada', 'success');
            setModalVisible(false);
            loadBrands();
        } catch (error) {
            showNotification('Error al guardar', 'error');
        }
    };

    const getOriginBadge = (origin) => {
        const styles = {
            EUROPE: { bg: '#312e81', text: '#e0e7ff', label: '🇪🇺 Europeo' },
            ASIA: { bg: '#831843', text: '#fce7f3', label: '🇯🇵 Asiático' },
            USA: { bg: '#14532d', text: '#dcfce7', label: '🇺🇸 Americano' },
            OTHER: { bg: '#334155', text: '#f1f5f9', label: 'Otros' }
        };
        const style = styles[origin] || styles.OTHER;
        return (
            <span style={{
                background: style.bg,
                color: style.text,
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                textTransform: 'uppercase'
            }}>
                {style.label}
            </span>
        );
    };

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
                <div>
                    <h1 style={{ color: 'white', fontSize: '2rem', margin: 0 }}>Marcas de Vehículos</h1>
                    <p style={{ color: '#94a3b8' }}>Gestiona la identidad y procedencia de las marcas buscables en la tienda.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="secondary" onClick={handleSync} disabled={loading}>
                        🔄 Sincronizar desde Catálogo
                    </Button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {brands.map(brand => (
                    <div key={brand.name} style={{
                        background: '#1e293b',
                        padding: '1.5rem',
                        borderRadius: '1rem',
                        border: '1px solid #334155',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        position: 'relative',
                        transition: 'transform 0.2s',
                    }}>
                        {brand.is_popular && (
                            <span style={{
                                position: 'absolute',
                                top: '-10px',
                                right: '10px',
                                background: '#f59e0b',
                                color: 'black',
                                padding: '2px 10px',
                                borderRadius: '10px',
                                fontSize: '0.65rem',
                                fontWeight: 'black'
                            }}>
                                ⭐ POPULAR
                            </span>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                background: 'white',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                border: '2px solid #334155'
                            }}>
                                {brand.logo_url ? (
                                    <img src={brand.logo_url} alt={brand.name} style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} />
                                ) : (
                                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#64748b' }}>{brand.name[0]}</span>
                                )}
                            </div>
                            <div>
                                <h3 style={{ color: '#f8fafc', margin: 0, fontSize: '1.2rem' }}>{brand.name}</h3>
                                {getOriginBadge(brand.origin)}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                            <Button size="sm" variant="secondary" onClick={() => handleEdit(brand)} style={{ flex: 1 }}>Configurar</Button>
                            <Button size="sm" variant="danger" onClick={() => handleDelete(brand.name)}>✕</Button>
                        </div>
                    </div>
                ))}
            </div>

            {brands.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '5rem', background: '#1e293b', borderRadius: '1rem', border: '2px dashed #334155' }}>
                    <p style={{ color: '#94a3b8', fontSize: '1.2rem' }}>No hay marcas registradas.</p>
                    <p style={{ color: '#64748b' }}>Haz clic en "Sincronizar" para descubrir las marcas desde tus productos.</p>
                </div>
            )}

            <Modal
                isOpen={modalVisible}
                onClose={() => setModalVisible(false)}
                title={`Configurar Marca: ${editingBrand?.name}`}
            >
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: '400px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 'bold' }}>ORIGEN / PROCEDENCIA</label>
                        <select
                            value={formData.origin}
                            onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                            style={{
                                background: '#0f172a',
                                color: 'white',
                                border: '1px solid #334155',
                                padding: '0.8rem',
                                borderRadius: '0.5rem',
                                outline: 'none'
                            }}
                        >
                            <option value="EUROPE">🇪🇺 Europeo</option>
                            <option value="ASIA">🇯🇵 Asiático</option>
                            <option value="USA">🇺🇸 Americano</option>
                            <option value="OTHER">Otros / Desconocido</option>
                        </select>
                    </div>

                    <Input
                        label="URL del Logo (Opcional)"
                        value={formData.logo_url}
                        onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                        placeholder="https://ejemplo.com/logo.png"
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <input
                            type="checkbox"
                            id="is_popular"
                            checked={formData.is_popular}
                            onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                            style={{ width: '20px', height: '20px' }}
                        />
                        <label htmlFor="is_popular" style={{ color: 'white', fontWeight: 'bold' }}>Marcar como Marca Popular (Filtros rápidos)</label>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
                        <Button type="button" variant="secondary" onClick={() => setModalVisible(false)}>Cancelar</Button>
                        <Button type="submit" variant="primary">Guardar Cambios</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default BrandManagement;
