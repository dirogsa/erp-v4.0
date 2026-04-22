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
    AlertCircle,
    Settings,
    Layout,
    Eye,
    EyeOff
} from 'lucide-react';

const BrandManagement = () => {
    const { showNotification } = useNotification();
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState({ progress: 0, total: 0, current_step: '', is_running: false });
    const [modalVisible, setModalVisible] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        parent_name: '',
        origin: 'OTHER',
        logo_url: '',
        is_popular: false,
        is_active: true
    });

    useEffect(() => {
        loadBrands();
        checkSyncStatus();
    }, []);

    const loadBrands = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await brandService.getBrands();
            setBrands(res.data);
        } catch (error) {
            showNotification('Error cargando marcas', 'error');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleToggleVisibility = async (brand) => {
        const newStatus = !brand.is_active;
        
        // Affected names includes the parent and all its children
        const affectedNames = [brand.name, ...(brand.children ? brand.children.map(c => c.name) : [])];
        
        // Optimistic UI Update
        setBrands(prev => prev.map(b => affectedNames.includes(b.name) ? { ...b, is_active: newStatus } : b));
        
        try {
            if (affectedNames.length === 1) {
                await brandService.updateBrand(brand.name, { ...brand, is_active: newStatus });
            } else {
                await brandService.bulkUpdateBrands(affectedNames, { is_active: newStatus });
            }
        } catch (error) {
            showNotification('Error al cambiar visibilidad', 'error');
            // Rollback
            setBrands(prev => prev.map(b => affectedNames.includes(b.name) ? { ...b, is_active: !newStatus } : b));
        }
    };

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
                // If it was running and now it's not, we finished
                setSyncing(false);
                showNotification(res.data.last_result || 'Sincronización finalizada', 'success');
                loadBrands();
            }
        } catch (error) {
            console.error("Failed to check sync status", error);
        }
    };

    const handleSync = async () => {
        if (!window.confirm('¿Deseas iniciar la sincronización masiva? El proceso correrá en segundo plano y podrás ver el progreso aquí mismo.')) return;
        try {
            await brandService.syncBrands();
            setSyncing(true);
            showNotification('Sincronización iniciada', 'info');
        } catch (error) {
            showNotification('Error al iniciar sincronización', 'error');
        }
    };

    const handleEdit = (brand) => {
        setEditingBrand(brand);
        setFormData({
            name: brand.name,
            parent_name: brand.parent_name || '',
            origin: brand.origin,
            logo_url: brand.logo_url || '',
            is_popular: brand.is_popular || false,
            is_active: brand.is_active !== undefined ? brand.is_active : true
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
            loadBrands(true); // Silent reload
        } catch (error) {
            showNotification('Error al guardar', 'error');
        }
    };

    const [selectedBrands, setSelectedBrands] = useState([]);
    const [filterStatus, setFilterStatus] = useState('all'); // all, active, hidden

    const rootsCount = brands.filter(b => !b.parent_name).length;
    const activeCount = brands.filter(b => !b.parent_name && b.is_active === true).length;
    const hiddenCount = brands.filter(b => !b.parent_name && b.is_active !== true).length;

    // Hierarchy Logic for Admin UI: Group Variants under Root Brands
    const groupedBrands = React.useMemo(() => {
        const brandMap = {};
        // Use all brands to build the map
        brands.forEach(b => brandMap[b.name] = { ...b, children: [] });

        const roots = [];
        Object.values(brandMap).forEach(b => {
            if (b.parent_name && brandMap[b.parent_name]) {
                brandMap[b.parent_name].children.push(b);
            } else {
                roots.push(b);
            }
        });

        // Filter roots based on search term AND status filter
        const term = searchTerm.toUpperCase().trim();
        return roots.filter(root => {
            // Search filter
            const matchSearch = term ? (root.name.toUpperCase().includes(term) || root.children.some(child => child.name.toUpperCase().includes(term))) : true;
            
            // Status filter
            let matchStatus = true;
            if (filterStatus === 'active') matchStatus = root.is_active === true;
            if (filterStatus === 'hidden') matchStatus = root.is_active !== true;

            return matchSearch && matchStatus;
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [brands, searchTerm, filterStatus]);

    const handleBulkAction = async (action, value) => {
        if (selectedBrands.length === 0) return;
            
        // We need to gather all children of the selected brands
        const affectedNamesSet = new Set(selectedBrands);
        groupedBrands.forEach(g => {
            if (selectedBrands.includes(g.name)) {
                g.children.forEach(c => affectedNamesSet.add(c.name));
            }
        });
        const affectedNames = Array.from(affectedNamesSet);
        
        // Optimistic UI Update for Bulk
        setBrands(prev => prev.map(b => 
            affectedNames.includes(b.name) ? { ...b, [action]: value } : b
        ));
        
        setSelectedBrands([]); // Clear selection immediately for better UX
        
        try {
            await brandService.bulkUpdateBrands(affectedNames, { [action]: value });
            showNotification('Actualización masiva completada', 'success');
            loadBrands(true); // Silent reload to sync with server
        } catch (error) {
            showNotification('Error en actualización masiva', 'error');
            loadBrands(); // Full reload on error to restore state
        }
    };

    const toggleSelectAll = () => {
        if (selectedBrands.length === groupedBrands.length) {
            setSelectedBrands([]);
        } else {
            setSelectedBrands(groupedBrands.map(b => b.name));
        }
    };

    const toggleBrandSelection = (name) => {
        setSelectedBrands(prev => 
            prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
        );
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
        <div style={{ padding: '2.5rem', maxWidth: '1600px', margin: '0 auto', position: 'relative' }}>
            {/* Bulk Action Bar - Floating */}
            {selectedBrands.length > 0 && (
                <div style={{
                    position: 'fixed',
                    bottom: '2rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#6366f1',
                    padding: '1rem 2rem',
                    borderRadius: '100px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2rem',
                    boxShadow: '0 20px 25px -5px rgba(99, 102, 241, 0.4)',
                    zIndex: 1000,
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    animation: 'slideUp 0.3s ease-out'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'white', fontWeight: '900', fontSize: '1rem' }}>{selectedBrands.length}</span>
                        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', fontWeight: 'bold' }}>Marcas Seleccionadas</span>
                    </div>
                    
                    <div style={{ height: '24px', width: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
                    
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button 
                            onClick={() => handleBulkAction('is_active', true)}
                            style={{ background: 'white', color: '#6366f1', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '50px', fontSize: '0.85rem', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Settings style={{ height: '1rem' }} /> ACTIVAR
                        </button>
                        <button 
                            onClick={() => handleBulkAction('is_active', false)}
                            style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '50px', fontSize: '0.85rem', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Trash2 style={{ height: '1rem' }} /> OCULTAR
                        </button>
                        <button 
                            onClick={() => handleBulkAction('is_popular', true)}
                            style={{ background: '#fbbf24', color: 'black', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '50px', fontSize: '0.85rem', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            ⭐ DESTACAR
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

            {/* Premium Metrics Dashboard */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                {[
                    { id: 'all', label: 'Total Marcas', count: rootsCount, color: '#6366f1', icon: Tag, desc: 'Catálogo completo sincronizado' },
                    { id: 'active', label: 'Visibles en Tienda', count: activeCount, color: '#10b981', icon: Settings, desc: 'Disponibles para el cliente' },
                    { id: 'hidden', label: 'Marcas Ocultas', count: hiddenCount, color: '#ef4444', icon: Trash2, desc: 'Restringidas del buscador' }
                ].map(stat => (
                    <div 
                        key={stat.id}
                        onClick={() => setFilterStatus(stat.id)}
                        style={{
                            background: '#1e293b',
                            borderRadius: '1.5rem',
                            padding: '1.5rem 2rem',
                            border: '1px solid',
                            borderColor: filterStatus === stat.id ? stat.color : '#334155',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
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
                        <Layout style={{ height: '2.5rem', color: '#6366f1' }} /> Centro de Control
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '0.5rem' }}>Administra la visibilidad y prioridad del catálogo comercial.</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ position: 'relative' }}>
                            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', height: '1.2rem', color: '#64748b' }} />
                            <input 
                                type="text" 
                                placeholder="Buscar marca o variante..." 
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
                            {syncing ? 'Sincronizando...' : 'Sincronizar Catálogo'}
                        </Button>
                    </div>

                    {groupedBrands.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.8rem' }}>
                            <button 
                                onClick={() => setSelectedBrands(groupedBrands.map(b => b.name))}
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

            {/* World-Class Progress Bar */}
            {syncing && (
                <div style={{
                    background: '#1e293b',
                    border: '1px solid #6366f144',
                    borderRadius: '1.5rem',
                    padding: '1.5rem',
                    marginBottom: '3rem',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <RefreshCw className="animate-spin" style={{ color: '#6366f1', height: '1.5rem' }} />
                            <div>
                                <h4 style={{ color: 'white', margin: 0, fontSize: '1rem', fontWeight: '900', textTransform: 'uppercase' }}>
                                    {syncProgress.current_step || 'Procesando catálogo...'}
                                </h4>
                                <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.8rem' }}>No cierres esta ventana para un seguimiento en tiempo real.</p>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ color: '#6366f1', fontSize: '1.2rem', fontWeight: '900' }}>
                                {syncProgress.total > 0 ? Math.round((syncProgress.progress / syncProgress.total) * 100) : 0}%
                            </span>
                            <p style={{ color: '#64748b', margin: 0, fontSize: '0.7rem', fontWeight: 'bold' }}>
                                {syncProgress.progress} / {syncProgress.total} MARCAS
                            </p>
                        </div>
                    </div>
                    
                    {/* Progress Track */}
                    <div style={{ height: '8px', background: '#0f172a', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ 
                            height: '100%', 
                            background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)', 
                            width: `${syncProgress.total > 0 ? (syncProgress.progress / syncProgress.total) * 100 : 0}%`,
                            transition: 'width 0.5s ease-out',
                            boxShadow: '0 0 15px #6366f166'
                        }}></div>
                    </div>
                </div>
            )}

            {/* Grid Section */}
            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2.5rem' }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="pulse-skeleton" style={{ height: '300px', background: '#1e293b', borderRadius: '2rem', border: '1px solid #334155' }}></div>
                    ))}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2.5rem' }}>
                    {groupedBrands.map(brand => (
                        <div 
                            key={brand.name} 
                            style={{ 
                                background: '#1e293b', 
                                borderRadius: '2rem', 
                                border: '1px solid #334155', 
                                overflow: 'hidden', 
                                display: 'flex', 
                                flexDirection: 'column',
                                position: 'relative',
                                boxShadow: brand.is_popular ? '0 10px 20px -5px rgba(99, 102, 241, 0.2)' : '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
                                borderColor: selectedBrands.includes(brand.name) ? '#6366f1' : (brand.is_popular ? '#6366f166' : '#334155'),
                                transition: 'all 0.2s',
                                transform: selectedBrands.includes(brand.name) ? 'scale(1.02)' : 'scale(1)'
                            }}
                        >
                            {/* Checkbox Overlay */}
                            <div 
                                onClick={() => toggleBrandSelection(brand.name)}
                                style={{
                                    position: 'absolute',
                                    top: '1rem',
                                    right: '1rem',
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '8px',
                                    border: '2px solid #6366f1',
                                    background: selectedBrands.includes(brand.name) ? '#6366f1' : 'transparent',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 10
                                }}
                            >
                                {selectedBrands.includes(brand.name) && <Tag style={{ height: '1rem', color: 'white' }} />}
                            </div>

                            <div style={{ padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                                <div style={{ 
                                    width: '85px', 
                                    height: '85px', 
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
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ color: '#f8fafc', margin: 0, fontSize: '1.6rem', fontWeight: '900' }}>{brand.name}</h3>
                                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleToggleVisibility(brand); }}
                                                style={{ 
                                                    background: brand.is_active ? '#10b98122' : '#ef444422', 
                                                    color: brand.is_active ? '#10b981' : '#ef4444',
                                                    border: 'none',
                                                    padding: '4px',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.2s'
                                                }}
                                                title={brand.is_active ? "Ocultar en tienda" : "Mostrar en tienda"}
                                                className="hover-bright"
                                            >
                                                {brand.is_active ? <Eye style={{ height: '1.2rem' }} /> : <EyeOff style={{ height: '1.2rem' }} />}
                                            </button>
                                            {brand.is_popular && <span style={{ background: '#f59e0b', color: 'black', padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '900' }}>⭐ TOP</span>}
                                            {!brand.is_active && <span style={{ background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '900' }}>OCULTO</span>}
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        {getOriginBadge(brand.origin)}
                                        <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 'bold' }}>{brand.models.length} Modelos</span>
                                    </div>

                                    {/* Nested Variants Section */}
                                    {brand.children.length > 0 && (
                                        <div style={{ marginTop: '1.2rem', padding: '1rem', background: '#0f172a', borderRadius: '12px', border: '1px solid #334155' }}>
                                            <p style={{ color: '#6366f1', fontSize: '0.65rem', fontWeight: '900', textTransform: 'uppercase', marginBottom: '0.6rem', letterSpacing: '0.05em' }}>Variantes Agrupadas ({brand.children.length})</p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                                {brand.children.map(child => (
                                                    <div 
                                                        key={child.name} 
                                                        onClick={() => handleEdit(child)}
                                                        style={{ 
                                                            background: '#1e293b', 
                                                            color: '#e2e8f0', 
                                                            padding: '4px 10px', 
                                                            borderRadius: '8px', 
                                                            fontSize: '0.7rem', 
                                                            border: '1px solid #334155',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }}
                                                        className="hover-bright"
                                                    >
                                                        {child.name} <Pencil style={{ height: '0.6rem' }} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ padding: '1.5rem 2rem', background: '#0f172a44', borderTop: '1px solid #33415544', display: 'flex', gap: '1rem', marginTop: 'auto' }}>
                                <button 
                                    onClick={() => handleEdit(brand)}
                                    style={{ flex: 1, background: '#334155', color: 'white', border: 'none', padding: '0.8rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '900', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                    className="hover-bright"
                                >
                                    <Settings style={{ height: '1.2rem' }} /> CONFIGURAR MARCA
                                </button>
                                <button 
                                    onClick={() => handleDelete(brand.name)}
                                    style={{ background: '#ef444422', color: '#ef4444', border: 'none', padding: '0.8rem', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                                    className="hover-danger"
                                >
                                    <Trash2 style={{ height: '1.2rem' }} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {groupedBrands.length === 0 && !loading && (
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
                        <label style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 'bold' }}>MARCA PADRE (AGRUPACIÓN)</label>
                        <select
                            value={formData.parent_name}
                            onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
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
                            <option value="">— NINGUNA (ES MARCA PRINCIPAL) —</option>
                            {brands
                                .filter(b => b.name !== editingBrand?.name && !b.parent_name)
                                .map(b => (
                                    <option key={b.name} value={b.name}>{b.name}</option>
                                ))
                            }
                        </select>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '-0.5rem' }}>
                            Agrupa marcas similares para limpiar el buscador de la tienda (ej: TOYOTA INDUSTRIAL → TOYOTA)
                        </p>
                    </div>

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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#0f172a', padding: '1rem', borderRadius: '12px', border: '1px solid #334155' }}>
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            style={{ width: '22px', height: '22px' }}
                        />
                        <label htmlFor="is_active" style={{ color: 'white', fontWeight: '900', fontSize: '0.9rem' }}>Activo en la Tienda (Visible en buscador)</label>
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
                @keyframes slideUp { from { transform: translateX(-50%) translateY(100px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
};

export default BrandManagement;
