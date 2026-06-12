import React, { useState, useEffect } from 'react';
import { productBrandService } from '../services/api';
import Button from '../components/common/Button';
import Modal from '../components/Modal';
import { useNotification } from '../hooks/useNotification';
import { 
    Tag, 
    RefreshCw, 
    Search,
    AlertCircle,
    Settings,
    Layout,
    Eye,
    EyeOff
} from 'lucide-react';

const ProductBrandManagement = () => {
    const { showNotification } = useNotification();
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, active, hidden
    const [selectedBrands, setSelectedBrands] = useState([]);

    const [formData, setFormData] = useState({
        is_active: true,
        show_in_catalog: true
    });

    useEffect(() => {
        loadBrands();
    }, []);

    const loadBrands = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await productBrandService.getBrands();
            setBrands(res.data);
        } catch (error) {
            showNotification('Error cargando marcas de repuestos', 'error');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleToggleVisibility = async (brand) => {
        const newStatus = brand.show_in_catalog === false ? true : false;
        
        // Optimistic UI Update
        setBrands(prev => prev.map(b => b.name === brand.name ? { ...b, show_in_catalog: newStatus } : b));
        
        try {
            await productBrandService.updateBrand(brand.name, { ...brand, show_in_catalog: newStatus });
        } catch (error) {
            showNotification('Error al cambiar visibilidad de impresión', 'error');
            // Rollback
            setBrands(prev => prev.map(b => b.name === brand.name ? { ...b, show_in_catalog: !newStatus } : b));
        }
    };

    const handleSync = async () => {
        if (!window.confirm('¿Deseas iniciar la extracción masiva de marcas de repuesto desde las equivalencias?')) return;
        try {
            await productBrandService.syncBrands();
            setSyncing(true);
            showNotification('Sincronización iniciada en segundo plano', 'info');
            // Mocking a sync completion after 3s since this sync is fast
            setTimeout(() => {
                setSyncing(false);
                loadBrands();
                showNotification('Sincronización completada', 'success');
            }, 3000);
        } catch (error) {
            showNotification('Error al iniciar sincronización', 'error');
        }
    };

    const handleEdit = (brand) => {
        setEditingBrand(brand);
        setFormData({
            is_active: brand.is_active !== undefined ? brand.is_active : true,
            show_in_catalog: brand.show_in_catalog !== undefined ? brand.show_in_catalog : true
        });
        setModalVisible(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await productBrandService.updateBrand(editingBrand.name, { ...editingBrand, ...formData });
            showNotification('Marca actualizada', 'success');
            setModalVisible(false);
            loadBrands(true); // Silent reload
        } catch (error) {
            showNotification('Error al guardar', 'error');
        }
    };

    const handleBulkAction = async (action, value) => {
        if (selectedBrands.length === 0) return;
        
        // Optimistic UI Update
        setBrands(prev => prev.map(b => selectedBrands.includes(b.name) ? { ...b, [action]: value } : b));
        
        try {
            await productBrandService.bulkUpdateBrands(selectedBrands, { [action]: value });
            showNotification('Actualización masiva completada', 'success');
            setSelectedBrands([]);
            loadBrands(true);
        } catch (error) {
            showNotification('Error en actualización masiva', 'error');
            loadBrands(); 
        }
    };

    const toggleBrandSelection = (name) => {
        setSelectedBrands(prev => 
            prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
        );
    };

    const filteredBrands = React.useMemo(() => {
        const term = searchTerm.toUpperCase().trim();
        return brands.filter(b => {
            const matchSearch = term ? b.name.toUpperCase().includes(term) : true;
            let matchStatus = true;
            if (filterStatus === 'active') matchStatus = b.show_in_catalog !== false;
            if (filterStatus === 'hidden') matchStatus = b.show_in_catalog === false;
            return matchSearch && matchStatus;
        });
    }, [brands, searchTerm, filterStatus]);

    const activeCount = brands.filter(b => b.show_in_catalog !== false).length;
    const hiddenCount = brands.filter(b => b.show_in_catalog === false).length;

    return (
        <div style={{ padding: '2.5rem', maxWidth: '1600px', margin: '0 auto', position: 'relative' }}>
            {selectedBrands.length > 0 && (
                <div style={{
                    position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
                    background: '#6366f1', padding: '1rem 2rem', borderRadius: '100px',
                    display: 'flex', alignItems: 'center', gap: '2rem',
                    boxShadow: '0 20px 25px -5px rgba(99, 102, 241, 0.4)', zIndex: 1000,
                    border: '2px solid rgba(255, 255, 255, 0.2)', animation: 'slideUp 0.3s ease-out'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'white', fontWeight: '900', fontSize: '1rem' }}>{selectedBrands.length}</span>
                        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', fontWeight: 'bold' }}>Marcas Seleccionadas</span>
                    </div>
                    <div style={{ height: '24px', width: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button 
                            onClick={() => handleBulkAction('show_in_catalog', true)}
                            style={{ background: 'white', color: '#6366f1', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '50px', fontSize: '0.85rem', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Settings style={{ height: '1rem' }} /> INCLUIR EN CATÁLOGO
                        </button>
                        <button 
                            onClick={() => handleBulkAction('show_in_catalog', false)}
                            style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '50px', fontSize: '0.85rem', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <EyeOff style={{ height: '1rem' }} /> EXCLUIR
                        </button>
                        <button 
                            onClick={() => setSelectedBrands([])}
                            style={{ background: 'transparent', color: 'white', border: 'none', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', marginLeft: '1rem' }}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                {[
                    { id: 'all', label: 'Total Marcas Aftermarket', count: brands.length, color: '#6366f1', icon: Tag, desc: 'Catálogo completo sincronizado' },
                    { id: 'active', label: 'Impresión Habilitada', count: activeCount, color: '#10b981', icon: Settings, desc: 'Equivalencias que se imprimirán' },
                    { id: 'hidden', label: 'Excluidas de Impresión', count: hiddenCount, color: '#94a3b8', icon: EyeOff, desc: 'Omitidas para ahorrar espacio' }
                ].map(stat => (
                    <div 
                        key={stat.id}
                        onClick={() => setFilterStatus(stat.id)}
                        style={{
                            background: '#1e293b', borderRadius: '1.5rem', padding: '1.5rem 2rem',
                            border: '1px solid', borderColor: filterStatus === stat.id ? stat.color : '#334155',
                            cursor: 'pointer', transition: 'all 0.2s',
                            boxShadow: filterStatus === stat.id ? `0 10px 15px -3px ${stat.color}22` : 'none',
                            transform: filterStatus === stat.id ? 'translateY(-5px)' : 'none'
                        }}
                        className="hover-bright"
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 'bold', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</p>
                                <h2 style={{ color: 'white', fontSize: '2.5rem', fontWeight: '900', margin: '0.5rem 0' }}>{stat.count}</h2>
                                <p style={{ color: '#64748b', fontSize: '0.75rem', margin: 0 }}>{stat.desc}</p>
                            </div>
                            <div style={{ background: `${stat.color}22`, padding: '1rem', borderRadius: '1rem' }}>
                                <stat.icon style={{ height: '2rem', color: stat.color }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: '900', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Layout style={{ height: '2.5rem', color: '#6366f1' }} /> Marcas de Repuesto
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '0.5rem' }}>
                        Administra qué equivalencias aftermarket se imprimirán en el catálogo físico (Katalog). <br/>
                        <span style={{color: '#ef4444', fontWeight: 'bold'}}>Nota:</span> En la tienda web online siempre aparecerán todas para favorecer el SEO.
                    </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ position: 'relative' }}>
                            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', height: '1.2rem', color: '#64748b' }} />
                            <input 
                                type="text" 
                                placeholder="Buscar marca..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    background: '#1e293b', border: '1px solid #334155', borderRadius: '12px',
                                    padding: '0.8rem 1rem 0.8rem 2.8rem', color: 'white', outline: 'none', minWidth: '300px'
                                }}
                            />
                        </div>
                        <Button variant="primary" onClick={handleSync} disabled={syncing} style={{ padding: '0.8rem 1.5rem', fontWeight: '900', textTransform: 'uppercase' }}>
                            <RefreshCw className={syncing ? "animate-spin" : ""} style={{ height: '1.2rem' }} />
                            {syncing ? 'Sincronizando...' : 'Extraer Equivalencias'}
                        </Button>
                    </div>

                    {filteredBrands.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.8rem' }}>
                            <button 
                                onClick={() => setSelectedBrands(filteredBrands.map(b => b.name))}
                                style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Seleccionar Todo
                            </button>
                            {selectedBrands.length > 0 && (
                                <button 
                                    onClick={() => setSelectedBrands([])}
                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    Limpiar Selección
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="pulse-skeleton" style={{ height: '120px', background: '#1e293b', borderRadius: '1.5rem', border: '1px solid #334155' }}></div>
                    ))}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {filteredBrands.map(brand => (
                        <div 
                            key={brand.name} 
                            style={{ 
                                background: '#1e293b', borderRadius: '1.5rem', border: '1px solid #334155', 
                                overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
                                borderColor: selectedBrands.includes(brand.name) ? '#6366f1' : '#334155',
                                transition: 'all 0.2s', transform: selectedBrands.includes(brand.name) ? 'scale(1.02)' : 'scale(1)'
                            }}
                        >
                            <div 
                                onClick={() => toggleBrandSelection(brand.name)}
                                style={{
                                    position: 'absolute', top: '1rem', right: '1rem', width: '24px', height: '24px',
                                    borderRadius: '6px', border: '2px solid #6366f1',
                                    background: selectedBrands.includes(brand.name) ? '#6366f1' : 'transparent',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10
                                }}
                            >
                                {selectedBrands.includes(brand.name) && <Tag style={{ height: '1rem', color: 'white' }} />}
                            </div>

                            <div style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ color: '#f8fafc', margin: 0, fontSize: '1.2rem', fontWeight: '900' }}>{brand.name}</h3>
                                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginRight: '30px' }}>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleToggleVisibility(brand); }}
                                                style={{ 
                                                    background: brand.show_in_catalog !== false ? '#10b98122' : '#ef444422', 
                                                    color: brand.show_in_catalog !== false ? '#10b981' : '#ef4444',
                                                    border: 'none', padding: '4px', borderRadius: '6px', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                                                }}
                                                title={brand.show_in_catalog !== false ? "Excluir de catálogo impreso" : "Incluir en catálogo impreso"}
                                                className="hover-bright"
                                            >
                                                {brand.show_in_catalog !== false ? <Eye style={{ height: '1.2rem' }} /> : <EyeOff style={{ height: '1.2rem' }} />}
                                            </button>
                                            {brand.show_in_catalog === false && <span style={{ background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '900' }}>NO IMPRIMIR</span>}
                                        </div>
                                    </div>
                                    <p style={{color: '#64748b', fontSize: '0.8rem', margin: '0.5rem 0 0 0'}}>{brand.aliases?.length || 0} alias registrados</p>
                                </div>
                            </div>

                            <div style={{ padding: '1rem', background: '#0f172a44', borderTop: '1px solid #33415544' }}>
                                <button 
                                    onClick={() => handleEdit(brand)}
                                    style={{ width: '100%', background: '#334155', color: 'white', border: 'none', padding: '0.6rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '900', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                    className="hover-bright"
                                >
                                    <Settings style={{ height: '1rem' }} /> CONFIGURAR
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
                        Extrae las marcas de las equivalencias (botón arriba a la derecha).
                    </p>
                </div>
            )}

            <Modal
                isOpen={modalVisible}
                onClose={() => setModalVisible(false)}
                title={`Configurar Marca de Repuesto: ${editingBrand?.name}`}
            >
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: '450px' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#0f172a', padding: '1rem', borderRadius: '12px', border: '1px solid #38bdf844' }}>
                        <input
                            type="checkbox"
                            id="show_in_catalog"
                            checked={formData.show_in_catalog}
                            onChange={(e) => setFormData({ ...formData, show_in_catalog: e.target.checked })}
                            style={{ width: '22px', height: '22px' }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label htmlFor="show_in_catalog" style={{ color: '#38bdf8', fontWeight: '900', fontSize: '0.9rem' }}>Imprimir en Catálogo Físico</label>
                            <span style={{color: '#94a3b8', fontSize: '0.75rem'}}>Si desmarcas esto, la marca no aparecerá en el PDF. La tienda web mostrará todo.</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid #334155', paddingTop: '1.5rem' }}>
                        <Button type="button" variant="secondary" onClick={() => setModalVisible(false)} style={{ borderRadius: '12px' }}>Cancelar</Button>
                        <Button type="submit" variant="primary" style={{ borderRadius: '12px', padding: '0.8rem 2rem' }}>Guardar Cambios</Button>
                    </div>
                </form>
            </Modal>

            <style>{`
                .hover-bright:hover { filter: brightness(1.2); }
                .pulse-skeleton { animation: pulse 1.5s infinite ease-in-out; }
                @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.8; } }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes slideUp { from { transform: translateX(-50%) translateY(100px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
};

export default ProductBrandManagement;
