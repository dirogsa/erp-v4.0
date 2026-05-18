import React, { useState, useEffect } from 'react';
import { categoryService } from '../services/api';
import Button from '../components/common/Button';
import { useNotification } from '../hooks/useNotification';
import { useLoading } from '../context/LoadingContext';
import Layout from '../components/Layout';
import { 
    Package, Droplet, Zap, Filter, Battery, Truck, 
    Layers, ChevronRight, ChevronDown, Trash2, 
    Rocket, Plus, Info, Database, Search, FolderPlus,
    Activity, CheckCircle2, AlertCircle, RefreshCw,
    HelpCircle, Eye, Tag, Settings2, Target, BarChart3,
    ArrowRightLeft, FileJson
} from 'lucide-react';

const ICON_LIST = [
    { name: 'Package', icon: Package },
    { name: 'Droplet', icon: Droplet },
    { name: 'Zap', icon: Zap },
    { name: 'Filter', icon: Filter },
    { name: 'Battery', icon: Battery },
    { name: 'Truck', icon: Truck },
    { name: 'Layers', icon: Layers }
];

const Categories = () => {
    const { showNotification } = useNotification();
    const { showLoading, hideLoading } = useLoading();
    const [categories, setCategories] = useState([]);
    const [orphans, setOrphans] = useState([]);
    const [activeTab, setActiveTab] = useState('explorer');
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [expandedIds, setExpandedIds] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [formData, setFormData] = useState({
        name: '', parent_id: '', icon: 'Package', color: '#6366f1',
        import_aliases: [], attributes_schema: []
    });

    useEffect(() => { loadCategories(); }, []);

    const loadCategories = async () => {
        try {
            const catRes = await categoryService.getCategories();
            setCategories(catRes.data);
            if (expandedIds.size === 0) {
                const roots = catRes.data.filter(c => !c.parent_id).map(c => c._id);
                setExpandedIds(new Set(roots));
            }
        } catch (error) { showNotification('Error al cargar taxonomía', 'error'); }
    };

    const loadOrphans = async (manual = false) => {
        setIsProcessing(true);
        if (manual) showLoading("Escaneando Base de Datos...", "Analizando inconsistencias taxonómicas en el inventario global.");
        try {
            const orphanRes = await categoryService.getOrphans();
            setOrphans(orphanRes.data);
            if (manual) showNotification('Base de datos analizada', 'success');
        } catch (error) { showNotification('Error al buscar huérfanos', 'error'); }
        finally { 
            setIsProcessing(false); 
            hideLoading();
        }
    };

    useEffect(() => {
        if (activeTab === 'reconciliation') loadOrphans();
    }, [activeTab]);

    const toggleExpand = (id) => {
        const next = new Set(expandedIds);
        if (next.has(id)) next.delete(id); else next.add(id);
        setExpandedIds(next);
    };

    const handleSelectCategory = (category) => {
        setSelectedCategoryId(category._id);
        setFormData({
            name: category.name,
            parent_id: category.parent_id || '',
            icon: category.icon || 'Package',
            color: category.color || '#6366f1',
            import_aliases: category.import_aliases || [],
            attributes_schema: category.attributes_schema || []
        });
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        const cleanData = { ...formData, parent_id: formData.parent_id === '' ? null : formData.parent_id };
        try {
            if (selectedCategoryId === 'NEW') await categoryService.createCategory(cleanData);
            else await categoryService.updateCategory(selectedCategoryId, cleanData);
            
            showNotification('Maestro actualizado', 'success');
            
            // Auto-expand the parent so the new child is visible
            if (cleanData.parent_id) {
                setExpandedIds(prev => new Set(prev).add(cleanData.parent_id));
            }
            
            setSearchTerm(''); // Clear search so the list isn't artificially filtered
            setSelectedCategoryId(null);
            loadCategories();
        } catch (error) { showNotification('Error al procesar', 'error'); }
    };

    const handleMapOrphan = async (orphanName, canonicalId) => {
        setIsProcessing(true);
        showLoading("Sincronizando Taxonomía...", `Mapeando registros técnicos a la categoría oficial.`);
        try {
            await categoryService.mapOrphan(orphanName, canonicalId);
            showNotification(`Sincronización exitosa: "${orphanName}" mapeado`, 'success');
            loadOrphans();
            loadCategories();
        } catch (error) { showNotification('Error en mapeo', 'error'); }
        finally { 
            setIsProcessing(false); 
            hideLoading();
        }
    };

    const findBestMatch = (orphanName) => {
        if (!orphanName) return '';
        const normalizedOrphan = orphanName.toLowerCase().replace(/\s+/g, '');
        const match = categories.find(c => 
            c.name.toLowerCase().replace(/\s+/g, '') === normalizedOrphan ||
            c.import_aliases.some(a => a.toLowerCase().replace(/\s+/g, '') === normalizedOrphan)
        );
        return match ? match._id : '';
    };

    const renderTree = (parentId = null, level = 0) => {
        return categories
            .filter(c => (c.parent_id || null) === (parentId || null))
            .filter(c => !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(cat => {
                const hasChildren = categories.some(c => c.parent_id === cat._id);
                const isExpanded = expandedIds.has(cat._id);
                const isSelected = selectedCategoryId === cat._id;
                const IconComp = ICON_LIST.find(i => i.name === cat.icon)?.icon || Package;

                return (
                    <div key={cat._id} style={{ display: 'flex', flexDirection: 'column' }}>
                        <div 
                            onClick={() => handleSelectCategory(cat)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem',
                                paddingLeft: `${level * 1.5 + 0.8}rem`, borderRadius: '0.75rem', cursor: 'pointer',
                                background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                borderLeft: isSelected ? '3px solid #6366f1' : '3px solid transparent',
                                transition: '0.2s', margin: '2px 0'
                            }}
                        >
                            <div onClick={(e) => { e.stopPropagation(); toggleExpand(cat._id); }} style={{ width: '16px', color: '#475569' }}>
                                {hasChildren ? (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : null}
                            </div>
                            <IconComp size={16} color={cat.color} />
                            <span style={{ fontSize: '0.9rem', color: isSelected ? 'white' : '#cbd5e1', fontWeight: isSelected ? '700' : '500' }}>{cat.name}</span>
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                                {cat.import_aliases?.length > 0 && (
                                    <span style={{ fontSize: '0.65rem', background: '#1e293b', color: '#6366f1', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                        {cat.import_aliases.length} ALIAS
                                    </span>
                                )}
                            </div>
                        </div>
                        {isExpanded && renderTree(cat._id, level + 1)}
                    </div>
                );
            });
    };

    return (
        <Layout>
            <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '1.5rem 2rem', borderRadius: '1.5rem', border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ background: '#6366f1', padding: '0.75rem', borderRadius: '1rem' }}><Layers size={28} color="white" /></div>
                        <div>
                            <h1 style={{ color: 'white', margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>Centro de Taxonomía Técnica</h1>
                            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>Gobernanza de categorías y motor de reconciliación industrial</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', background: '#0f172a', padding: '0.4rem', borderRadius: '0.8rem', gap: '0.25rem' }}>
                        <button 
                            onClick={() => setActiveTab('explorer')}
                            style={{ 
                                background: activeTab === 'explorer' ? '#6366f1' : 'transparent', color: activeTab === 'explorer' ? 'white' : '#64748b',
                                border: 'none', padding: '0.6rem 1.2rem', borderRadius: '0.6rem', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: '0.3s'
                            }}
                        >
                            <Search size={16} /> Explorador
                        </button>
                        <button 
                            onClick={() => setActiveTab('reconciliation')}
                            style={{ 
                                background: activeTab === 'reconciliation' ? '#f59e0b' : 'transparent', color: activeTab === 'reconciliation' ? 'white' : '#64748b',
                                border: 'none', padding: '0.6rem 1.2rem', borderRadius: '0.6rem', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: '0.3s'
                            }}
                        >
                            <ArrowRightLeft size={16} /> Sincronización 
                            {orphans.length > 0 && <span style={{ background: '#ef4444', color: 'white', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '10px', marginLeft: '5px' }}>{orphans.length}</span>}
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: activeTab === 'explorer' ? '380px 1fr' : '1fr', gap: '2rem', flex: 1, overflow: 'hidden' }}>
                    {activeTab === 'explorer' ? (
                        <>
                            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '1.5rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#0f172a', padding: '0.75rem 1rem', borderRadius: '1rem', marginBottom: '1.5rem', border: '1px solid #334155' }}>
                                    <Search size={18} color="#64748b" />
                                    <input placeholder="Filtrar taxonomía..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem' }} />
                                </div>
                                <div style={{ flex: 1, overflowY: 'auto' }}>
                                    {renderTree()}
                                </div>
                                <button 
                                    onClick={() => { setSelectedCategoryId('NEW'); setFormData({ name: '', parent_id: '', icon: 'Package', color: '#6366f1', import_aliases: [], attributes_schema: [] }); }}
                                    style={{ marginTop: '1.5rem', width: '100%', padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px dashed #6366f1', color: '#818cf8', borderRadius: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justify: 'center', gap: '0.5rem' }}
                                >
                                    <Plus size={18} /> Nueva Raíz
                                </button>
                            </div>

                            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '1.5rem', padding: '3rem', overflowY: 'auto' }}>
                                {selectedCategoryId ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase' }}>{selectedCategoryId === 'NEW' ? 'Nuevo Registro' : 'Ficha de Categoría'}</div>
                                            {selectedCategoryId !== 'NEW' && (
                                                <button 
                                                    onClick={() => { setSelectedCategoryId('NEW'); setFormData({ ...formData, name: '', parent_id: selectedCategoryId, import_aliases: [], attributes_schema: [] }); }}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#10b981', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '0.8rem', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}
                                                >
                                                    <FolderPlus size={16} /> Agregar Sub-categoría
                                                </button>
                                            )}
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase' }}>Nombre Oficial</label>
                                                <input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '0.75rem', padding: '0.8rem 1rem', color: 'white', fontSize: '1rem' }} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase' }}>Ubicación</label>
                                                <select value={formData.parent_id} onChange={(e) => setFormData({...formData, parent_id: e.target.value})} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '0.75rem', padding: '0.8rem 1rem', color: 'white' }}>
                                                    <option value="">(Raíz)</option>
                                                    {categories.filter(c => c._id !== selectedCategoryId).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}><Tag size={20} color="#6366f1" /><h3 style={{ margin: 0, color: 'white', fontSize: '1.1rem' }}>Smart Aliases (Motor de Ingesta)</h3></div>
                                            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Agrega nombres alternativos que aparecen en catálogos para que el sistema los auto-identifique.</p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', background: '#0f172a', padding: '1.5rem', borderRadius: '1rem', border: '1px dashed #334155' }}>
                                                {formData.import_aliases.map((alias, idx) => (
                                                    <div key={idx} style={{ background: '#1e293b', border: '1px solid #334155', color: '#a5b4fc', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        {alias}
                                                        <button onClick={() => setFormData({...formData, import_aliases: formData.import_aliases.filter((_, i) => i !== idx)})} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}>×</button>
                                                    </div>
                                                ))}
                                                <input 
                                                    placeholder="+ Enter para agregar" 
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && e.target.value) {
                                                            const val = e.target.value.trim().toUpperCase();
                                                            if (!formData.import_aliases.includes(val)) setFormData({...formData, import_aliases: [...formData.import_aliases, val]});
                                                            e.target.value = '';
                                                        }
                                                    }}
                                                    style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', flex: 1, minWidth: '150px' }}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}><FileJson size={20} color="#10b981" /><h3 style={{ margin: 0, color: 'white', fontSize: '1.1rem' }}>Esquema de Atributos Técnicos</h3></div>
                                            <div style={{ background: '#0f172a', padding: '2rem', borderRadius: '1rem', textAlign: 'center', border: '1px solid #334155' }}>
                                                <Settings2 size={32} color="#475569" style={{ marginBottom: '1rem' }} />
                                                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Define los campos obligatorios para esta categoría (ej: Altura, Rosca, Voltaje).</p>
                                                <Button variant="secondary" style={{ marginTop: '1.5rem', fontSize: '0.8rem' }}>Configurar Atributos</Button>
                                            </div>
                                        </div>

                                        <div style={{ borderTop: '1px solid #334155', paddingTop: '2rem', display: 'flex', gap: '1rem' }}>
                                            <Button onClick={handleSave} style={{ flex: 1 }}><Rocket size={18} style={{ marginRight: '0.5rem' }} /> Guardar Master</Button>
                                            {selectedCategoryId !== 'NEW' && (
                                                <button 
                                                    onClick={() => { if(window.confirm('¿Eliminar permanentemente?')) categoryService.deleteCategory(selectedCategoryId).then(() => { loadCategories(); setSelectedCategoryId(null); }); }}
                                                    style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0 1.5rem', borderRadius: '1rem', cursor: 'pointer' }}
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justify: 'center', textAlign: 'center', color: '#475569' }}>
                                        <Layers size={64} style={{ marginBottom: '1.5rem', opacity: 0.2 }} />
                                        <h3 style={{ color: '#94a3b8', margin: 0 }}>Taxonomía de Alto Nivel</h3>
                                        <p style={{ maxWidth: '400px', fontSize: '0.95rem' }}>Selecciona una categoría para gestionar su identidad técnica, alias de importación y esquemas de datos.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '2rem', padding: '4rem', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '4rem', borderBottom: '1px solid #334155', paddingBottom: '2rem' }}>
                                <Activity size={48} color="#f59e0b" />
                                <div style={{ flex: 1 }}>
                                    <h2 style={{ color: 'white', margin: 0, fontSize: '2.2rem', fontWeight: '950' }}>War Room: Reconciliación Industrial</h2>
                                    <p style={{ color: '#94a3b8', margin: '0.5rem 0 0', fontSize: '1.1rem' }}>Sincroniza nombres de catálogos con tu taxonomía oficial mediante heurística de datos.</p>
                                </div>
                                <button onClick={() => loadOrphans(true)} disabled={isProcessing} style={{ background: '#6366f1', color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                    <RefreshCw size={20} className={isProcessing ? 'animate-spin' : ''} /> Escanear Base de Datos
                                </button>
                            </div>

                            {orphans.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '6rem' }}>
                                    <CheckCircle2 size={80} color="#10b981" style={{ marginBottom: '2rem', opacity: 0.5 }} />
                                    <h3 style={{ color: 'white', fontSize: '1.8rem' }}>¡Taxonomía Íntegra!</h3>
                                    <p style={{ color: '#64748b' }}>No se han detectado productos huérfanos o nombres desconocidos.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2rem' }}>
                                    {orphans.map(orphan => {
                                        const suggestedId = findBestMatch(orphan._id);
                                        return (
                                            <div key={orphan._id} style={{ background: '#0f172a', borderRadius: '2rem', padding: '2rem', border: '1px solid #334155', borderLeft: '8px solid #f59e0b', position: 'relative' }}>
                                                <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>HUÉRFANO</div>
                                                <div style={{ marginBottom: '1.5rem' }}>
                                                    <div style={{ color: 'white', fontSize: '1.4rem', fontWeight: '900', fontFamily: 'monospace' }}>"{orphan._id}"</div>
                                                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.5rem' }}>Detectado en <b style={{ color: '#f59e0b' }}>{orphan.count}</b> productos</div>
                                                </div>
                                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '1rem', marginBottom: '2rem' }}>
                                                    <div style={{ fontSize: '0.7rem', color: '#475569', fontWeight: '900', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Eye size={12} /> MUESTRAS:</div>
                                                    <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                                                        {orphan.samples.map((s, i) => <li key={i}>{s}</li>)}
                                                    </ul>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '800' }}>{suggestedId ? '✨ Sugerencia detectada:' : 'Asignar a categoría oficial:'}</label>
                                                    <select 
                                                        value={suggestedId}
                                                        onChange={(e) => handleMapOrphan(orphan._id, e.target.value)}
                                                        style={{ width: '100%', background: '#1e293b', border: suggestedId ? '2px solid #10b981' : '2px solid #6366f1', padding: '1rem', borderRadius: '1rem', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                                                    >
                                                        <option value="" disabled>Seleccionar...</option>
                                                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                                    </select>
                                                    <div style={{ fontSize: '0.7rem', color: '#475569', textAlign: 'center' }}>Al asignar, el sistema aprenderá el alias automáticamente.</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <style>{`
                    .animate-spin { animation: spin 1s linear infinite; }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    input:focus, select:focus { border-color: #6366f1 !important; outline: none; }
                `}</style>
            </div>
        </Layout>
    );
};

export default Categories;
