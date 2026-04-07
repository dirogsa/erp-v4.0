import React, { useState, useEffect } from 'react';
import { brandService } from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/Modal';
import { useNotification } from '../hooks/useNotification';
import { 
    Tag, 
    RefreshCw, 
    Pencil, 
    Trash2, 
    Search,
    AlertCircle 
} from 'lucide-react';

const BrandManagement = () => {
    const { showNotification } = useNotification();
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

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
        if (!window.confirm('¿Deseas escanear el catálogo para encontrar y actualizar todas las marcas y sus modelos? Esto puede tardar unos segundos.')) return;
        setSyncing(true);
        try {
            const res = await brandService.syncBrands();
            showNotification(res.data.message || 'Sincronización completada', 'success');
            await loadBrands();
        } catch (error) {
            console.error("Sync error:", error);
            showNotification('Error en la sincronización del catálogo', 'error');
        } finally {
            setSyncing(false);
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

    const filteredBrands = brands.filter(b => 
        b.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                padding: '2px 10px',
                borderRadius: '8px',
                fontSize: '0.65rem',
                fontWeight: '900',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
            }}>
                {style.label}
            </span>
        );
    };

    return (
        <div style={{ padding: '2.5rem', maxWidth: '1600px', margin: '0 auto' }}>
            {/* Syncing Overlay */}
            {syncing && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(15, 23, 42, 0.9)',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(8px)'
                }}>
                    <RefreshCw className="animate-spin" style={{ color: '#6366f1', width: '80px', height: '80px' }} />
                    <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '900', marginTop: '2rem' }}>SINCRONIZANDO CATÁLOGO</h2>
                    <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Buscando marcas y modelos en todos los productos activos...</p>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: '900', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Tag style={{ height: '2.5rem', color: '#6366f1' }} />
                        Marcas de Vehículos
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginTop: '0.5rem' }}>
                        Gestiona la base de datos de aplicaciones para los buscadores de la tienda.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', height: '1.2rem', color: '#64748b' }} />
                        <input 
                            type="text" 
                            placeholder="Buscar marca..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                background: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '12px',
                                padding: '0.8rem 1rem 0.8rem 2.8rem',
                                color: 'white',
                                outline: 'none',
                                minWidth: '300px'
                            }}
                        />
                    </div>
                    <Button variant="primary" onClick={handleSync} disabled={syncing} style={{ padding: '0.8rem 1.5rem', fontWeight: '900', textTransform: 'uppercase' }}>
                        <RefreshCw className={syncing ? "animate-spin" : ""} style={{ height: '1.2rem' }} />
                        Sincronizar Catálogo
                    </Button>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="pulse-skeleton" style={{ height: '300px', background: '#1e293b', borderRadius: '2rem', border: '1px solid #334155' }}></div>
                    ))}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '2rem' }}>
                    {filteredBrands.map(brand => (
                        <div key={brand.name} style={{
                            background: '#1e293b',
                            borderRadius: '2rem',
                            border: '1px solid #334155',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}>
                            {/* Card Header */}
                            <div style={{ padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center', borderBottom: '1px solid #33415544' }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    background: 'white',
                                    borderRadius: '1.2rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    border: '1px solid #334155',
                                    flexShrink: 0,
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}>
                                    {brand.logo_url ? (
                                        <img src={brand.logo_url} alt={brand.name} style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }} />
                                    ) : (
                                        <span style={{ fontSize: '2rem', fontWeight: '900', color: '#1e293b' }}>{brand.name[0]}</span>
                                    )}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h3 style={{ color: '#f8fafc', margin: 0, fontSize: '1.4rem', fontWeight: '900', truncate: true }}>{brand.name}</h3>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                                        {getOriginBadge(brand.origin)}
                                        {brand.is_popular && (
                                            <span style={{ background: '#f59e0b22', color: '#fbbf24', padding: '2px 8px', borderRadius: '8px', fontSize: '0.6rem', fontWeight: '900' }}>⭐ TOP</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Models Section */}
                            <div style={{ padding: '1.5rem 2rem', flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Modelos Sincronizados</p>
                                    <span style={{ background: '#334155', color: '#94a3b8', padding: '2px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                        {brand.models?.length || 0}
                                    </span>
                                </div>
                                
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '100px', overflowY: 'auto', paddingRight: '5px' }} className="no-scrollbar">
                                    {(brand.models || []).length > 0 ? (
                                        brand.models.map(m => (
                                            <span key={m} style={{ background: '#0f172a', color: '#94a3b8', padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '600' }}>{m}</span>
                                        ))
                                    ) : (
                                        <p style={{ color: '#475569', fontSize: '0.75rem', fontStyle: 'italic' }}>Sin modelos detectados.</p>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ padding: '1.5rem 2rem', background: '#0f172a44', borderTop: '1px solid #33415544', display: 'flex', gap: '1rem' }}>
                                <button 
                                    onClick={() => handleEdit(brand)}
                                    style={{ flex: 1, background: '#334155', color: 'white', border: 'none', padding: '0.7rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '900', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                    className="hover-bright"
                                >
                                    <Pencil style={{ height: '1.1rem' }} /> CONFIGURAR
                                </button>
                                <button 
                                    onClick={() => handleDelete(brand.name)}
                                    style={{ background: '#ef444422', color: '#ef4444', border: 'none', padding: '0.7rem', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                                    className="hover-danger"
                                >
                                    <Trash2 style={{ height: '1.1rem' }} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {filteredBrands.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '8rem 2rem', background: '#1e293b', borderRadius: '3rem', border: '2px dashed #334155', marginTop: '2rem' }}>
                    <AlertCircle style={{ height: '5rem', color: '#334155', margin: '0 auto 1.5rem' }} />
                    <h3 style={{ color: 'white', fontSize: '1.8rem', fontWeight: '900' }}>No se encontraron marcas</h3>
                    <p style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '0.5rem', maxWidth: '500px', margin: '0.5rem auto 2.5rem' }}>
                        {searchTerm ? `No hay resultados para "${searchTerm}".` : 'Tu base de datos de aplicaciones está vacía actualmente.'}
                    </p>
                    {!searchTerm && (
                        <Button variant="primary" onClick={handleSync} style={{ padding: '1rem 2.5rem' }}>
                            Comenzar Sincronización Inicial
                        </Button>
                    )}
                </div>
            )}

            <Modal
                isOpen={modalVisible}
                onClose={() => setModalVisible(false)}
                title={`Configurar Marca: ${editingBrand?.name}`}
            >
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: '450px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 'bold' }}>ORIGEN / PROCEDENCIA</label>
                        <select
                            value={formData.origin}
                            onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                            style={{
                                background: '#0f172a',
                                color: 'white',
                                border: '1px solid #334155',
                                padding: '1rem',
                                borderRadius: '12px',
                                outline: 'none',
                                fontSize: '1rem'
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#0f172a', padding: '1rem', borderRadius: '12px', border: '1px solid #334155' }}>
                        <input
                            type="checkbox"
                            id="is_popular"
                            checked={formData.is_popular}
                            onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                            style={{ width: '22px', height: '22px' }}
                        />
                        <label htmlFor="is_popular" style={{ color: 'white', fontWeight: '900', fontSize: '0.9rem' }}>Marcar como Marca Popular (Filtros rápidos)</label>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid #334155', paddingTop: '1.5rem' }}>
                        <Button type="button" variant="secondary" onClick={() => setModalVisible(false)} style={{ borderRadius: '12px' }}>Cancelar</Button>
                        <Button type="submit" variant="primary" style={{ borderRadius: '12px', padding: '0.8rem 2rem' }}>Guardar Cambios</Button>
                    </div>
                </form>
            </Modal>

            <style>{`
                .hover-bright:hover { filter: brightness(1.2); }
                .hover-danger:hover { background: #ef444466 !important; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .sync-spinner { 
                    width: 80px; height: 80px; border: 4px solid #334155; border-top-color: #6366f1; 
                    border-radius: 50%; animation: spin 1s linear infinite; 
                }
                .pulse-skeleton { animation: pulse 1.5s infinite ease-in-out; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.8; } }
            `}</style>
        </div>
    );
};

export default BrandManagement;
