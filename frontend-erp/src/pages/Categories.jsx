import React, { useState, useEffect } from 'react';
import { categoryService } from '../services/api';
import Button from '../components/common/Button';
import { useNotification } from '../hooks/useNotification';
import Layout from '../components/Layout';
import { 
    Package, Droplet, Zap, Filter, Battery, Truck, 
    Layers, ChevronRight, ChevronDown, Trash2, 
    Rocket, Plus, Info, Database, Search, FolderPlus,
    Activity, CheckCircle2, AlertCircle, RefreshCw,
    HelpCircle, Eye, Tag
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
    const [categories, setCategories] = useState([]);
    const [orphans, setOrphans] = useState([]);
    const [activeTab, setActiveTab] = useState('explorer');
    
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [expandedIds, setExpandedIds] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        parent_id: '',
        icon: 'Package',
        color: '#6366f1',
        import_aliases: [],
        attributes_schema: []
    });

    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [lastOrphanFetch, setLastOrphanFetch] = useState(null);

    useEffect(() => { 
        loadCategories(); 
    }, []);

    // Carga de categorías (Maestro)
    const loadCategories = async () => {
        try {
            const catRes = await categoryService.getCategories();
            setCategories(catRes.data);
            
            if (expandedIds.size === 0 && isInitialLoad) {
                const roots = catRes.data.filter(c => !c.parent_id).map(c => c._id);
                setExpandedIds(new Set(roots));
                setIsInitialLoad(false);
            }
        } catch (error) {
            showNotification('Error al cargar taxonomía', 'error');
        }
    };

    // Carga de huérfanos (A pedido)
    const loadOrphans = async (manual = false) => {
        setIsProcessing(true);
        try {
            const orphanRes = await categoryService.getOrphans();
            setOrphans(orphanRes.data);
            setLastOrphanFetch(new Date());
            if (manual) showNotification('Base de datos analizada correctamente', 'success');
        } catch (error) {
            showNotification('Error al buscar huérfanos', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    // Trigger para carga de huérfanos al cambiar de pestaña
    useEffect(() => {
        if (activeTab === 'reconciliation' && !lastOrphanFetch) {
            loadOrphans();
        }
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

    const handleCreate = (parentId = '') => {
        setSelectedCategoryId('NEW');
        setFormData({
            name: '', parent_id: parentId, icon: 'Package', color: '#6366f1',
            import_aliases: [], attributes_schema: []
        });
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        if (!formData.name) return showNotification('Nombre obligatorio', 'error');
        
        try {
            if (selectedCategoryId === 'NEW') {
                await categoryService.createCategory(formData);
            } else {
                await categoryService.updateCategory(selectedCategoryId, formData);
            }
            showNotification(selectedCategoryId === 'NEW' ? 'Categoría creada' : 'Maestro actualizado', 'success');
            setSelectedCategoryId(null);
            loadCategories();
        } catch (error) { showNotification('Error al procesar', 'error'); }
    };

    const handleMapOrphan = async (orphanName, canonicalId) => {
        if (!canonicalId) return;
        setIsProcessing(true);
        try {
            await categoryService.mapOrphan(orphanName, canonicalId);
            showNotification(`Sistema sincronizado: "${orphanName}" ahora es parte de la taxonomía`, 'success');
            loadOrphans();
            loadCategories();
        } catch (error) {
            showNotification('Error en sincronización', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const renderTree = (parentId = null, level = 0) => {
        return categories
            .filter(c => c.parent_id === parentId)
            .filter(c => !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(cat => {
                const hasChildren = categories.some(c => c.parent_id === cat._id);
                const isExpanded = expandedIds.has(cat._id);
                const isSelected = selectedCategoryId === cat._id;
                const IconComp = ICON_LIST.find(i => i.name === cat.icon)?.icon || Package;

                return (
                    <div key={cat._id} className="tree-node">
                        <div 
                            className={`tree-item ${isSelected ? 'selected' : ''}`}
                            style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
                            onClick={() => handleSelectCategory(cat)}
                        >
                            <div className="tree-expander" onClick={(e) => { e.stopPropagation(); toggleExpand(cat._id); }}>
                                {hasChildren ? (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <div style={{width: 14}}/>}
                            </div>
                            <div className="tree-icon" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                                <IconComp size={14} />
                            </div>
                            <span className="tree-label">{cat.name}</span>
                            <div className="tree-actions">
                                <button onClick={(e) => { e.stopPropagation(); handleCreate(cat._id); }}><Plus size={14} /></button>
                            </div>
                        </div>
                        {isExpanded && renderTree(cat._id, level + 1)}
                    </div>
                );
            });
    };

    return (
        <Layout>
            <div className="cat-master-container">
                <div className="cat-header">
                    <div className="cat-title-group">
                        <div className="cat-icon-badge"><Layers size={24} /></div>
                        <div>
                            <h1>Taxonomía Industrial</h1>
                            <p>Gestión de categorías y motor de reconciliación de datos</p>
                        </div>
                    </div>
                    
                    <div className="tab-nav">
                        <button className={`tab-btn ${activeTab === 'explorer' ? 'active' : ''}`} onClick={() => setActiveTab('explorer')}>
                            <Database size={16} /> Explorador
                        </button>
                        <button className={`tab-btn ${activeTab === 'reconciliation' ? 'active' : ''}`} onClick={() => setActiveTab('reconciliation')}>
                            <RefreshCw size={16} className={isProcessing && activeTab === 'reconciliation' ? 'animate-spin' : ''} /> Sincronización
                            {orphans.length > 0 && <span className="orphan-badge animate-pulse">{orphans.length}</span>}
                        </button>
                    </div>
                </div>

                <div className="cat-main-layout">
                    {activeTab === 'explorer' ? (
                        <>
                            <div className="cat-explorer">
                                <div className="search-box">
                                    <Search size={16} />
                                    <input placeholder="Filtrar por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                </div>
                                <div className="tree-container">
                                    {renderTree()}
                                </div>
                                <button className="btn-add-root" onClick={() => handleCreate('')}>
                                    <Plus size={16} /> Nueva Categoría Raíz
                                </button>
                            </div>

                            <div className="cat-editor">
                                {selectedCategoryId ? (
                                    <div className="editor-content animate-in fade-in slide-in-from-right-4">
                                        <div className="editor-header-nav">
                                            <div className="editor-badge">{selectedCategoryId === 'NEW' ? 'Nuevo Registro' : 'Modificar Categoría'}</div>
                                            {selectedCategoryId !== 'NEW' && (
                                                <button className="btn-add-sub-context" onClick={() => handleCreate(selectedCategoryId)}>
                                                    <FolderPlus size={16} /> Crear Sub-categoría
                                                </button>
                                            )}
                                        </div>

                                        <div className="form-grid">
                                            <div className="field">
                                                <label>Nombre Oficial</label>
                                                <input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Ej: Filtros de Aire" />
                                            </div>
                                            <div className="field">
                                                <label>Ubicación (Padre)</label>
                                                <select value={formData.parent_id} onChange={(e) => setFormData({...formData, parent_id: e.target.value})}>
                                                    <option value="">(Raíz del Árbol)</option>
                                                    {categories.filter(c => c._id !== selectedCategoryId).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="editor-section">
                                            <div className="section-header"><Tag size={18} /> <h2>Motor de Reconocimiento (Aliases)</h2></div>
                                            <p className="section-tip">Escribe nombres del HTML/Excel y presiona <b>Enter</b> para que el sistema aprenda.</p>
                                            <div className="alias-container">
                                                {formData.import_aliases.map((alias, idx) => (
                                                    <div key={idx} className="alias-tag">
                                                        {alias}
                                                        <button onClick={() => setFormData({...formData, import_aliases: formData.import_aliases.filter((_, i) => i !== idx)})}>×</button>
                                                    </div>
                                                ))}
                                                <input className="alias-input" placeholder="+ Agregar término (Enter)" onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && e.target.value) {
                                                        const val = e.target.value.trim().toUpperCase();
                                                        if (!formData.import_aliases.includes(val)) {
                                                            setFormData({...formData, import_aliases: [...formData.import_aliases, val]});
                                                        }
                                                        e.target.value = '';
                                                    }
                                                }} />
                                            </div>
                                        </div>

                                        <div className="editor-footer">
                                            <div style={{ display: 'flex', gap: '1rem' }}>
                                                <Button onClick={handleSave} style={{ flex: 1 }}><Rocket size={18} /> Guardar Cambios</Button>
                                                {selectedCategoryId !== 'NEW' && (
                                                    <button className="btn-delete-final" onClick={() => {
                                                        if(window.confirm('¿Eliminar permanentemente?')) categoryService.deleteCategory(selectedCategoryId).then(() => { loadCategories(); setSelectedCategoryId(null); });
                                                    }}>
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="editor-empty">
                                        <Layers size={48} />
                                        <h3>Configuración de Taxonomía</h3>
                                        <p>Selecciona una rama del árbol para gestionar su identidad técnica y reglas de reconocimiento.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="reconciliation-panel animate-in fade-in">
                            <div className="recon-header">
                                <Activity size={32} color="#6366f1" />
                                <div style={{ flex: 1 }}>
                                    <h2>Limpieza de Datos (Huérfanos)</h2>
                                    <p>Asigna categorías oficiales a los nombres desconocidos encontrados en el sistema.</p>
                                </div>
                                <div className="recon-stats">
                                    {lastOrphanFetch && <span className="last-sync">Último escaneo: {lastOrphanFetch.toLocaleTimeString()}</span>}
                                    <button 
                                        className="btn-refresh-manual" 
                                        onClick={() => loadOrphans(true)}
                                        disabled={isProcessing}
                                    >
                                        <RefreshCw size={16} className={isProcessing ? 'animate-spin' : ''} />
                                        {isProcessing ? 'Escaneando...' : 'Escanear Base de Datos'}
                                    </button>
                                </div>
                            </div>
                            
                            {orphans.length === 0 ? (
                                <div className="recon-empty">
                                    <CheckCircle2 size={64} color="#10b981" />
                                    <h3>¡Base de Datos Sincronizada!</h3>
                                    <p>Todos los productos están correctamente clasificados en tu taxonomía.</p>
                                </div>
                            ) : (
                                <div className="recon-grid">
                                    {orphans.map(orphan => (
                                        <div key={orphan._id} className="recon-card">
                                            <div className="recon-card-header">
                                                <div className="recon-info">
                                                    <div className="orphan-name">"{orphan._id}"</div>
                                                    <div className="orphan-meta">Detectado en <b>{orphan.count}</b> productos</div>
                                                </div>
                                                <AlertCircle size={24} color="#f59e0b" />
                                            </div>
                                            
                                            <div className="recon-samples">
                                                <div className="sample-title"><Eye size={12} /> Productos Ejemplo:</div>
                                                <ul>
                                                    {orphan.samples.map((s, i) => <li key={i}>{s}</li>)}
                                                </ul>
                                            </div>

                                            <div className="recon-action-zone">
                                                <label>Asignar estos productos a:</label>
                                                <select 
                                                    onChange={(e) => handleMapOrphan(orphan._id, e.target.value)} 
                                                    defaultValue="" 
                                                    disabled={isProcessing}
                                                >
                                                    <option value="" disabled>Elegir categoría oficial...</option>
                                                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                                </select>
                                                <div className="recon-footer-tip">
                                                    Esto actualizará el inventario y guardará "{orphan._id}" como alias automático.
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <style>{`
                    .cat-master-container { padding: 2.5rem; max-width: 1400px; margin: 0 auto; height: calc(100vh - 40px); display: flex; flex-direction: column; overflow: hidden; gap: 2rem; }
                    .cat-header { display: flex; justify-content: space-between; align-items: center; background: #0f172a; padding: 1.5rem 2rem; border-radius: 24px; border: 1px solid #1e293b; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5); }
                    .cat-title-group { display: flex; align-items: center; gap: 1.5rem; }
                    .cat-icon-badge { background: #6366f1; color: white; padding: 12px; border-radius: 16px; box-shadow: 0 0 20px rgba(99, 102, 241, 0.4); }
                    .cat-header h1 { margin: 0; font-size: 1.6rem; font-weight: 950; color: white; letter-spacing: -0.03em; }
                    .cat-header p { margin: 0; color: #64748b; font-size: 0.9rem; font-weight: 500; }
                    
                    .tab-nav { display: flex; background: #1e293b; padding: 0.4rem; border-radius: 16px; gap: 0.25rem; border: 1px solid #334155; }
                    .tab-btn { background: transparent; border: none; color: #94a3b8; padding: 0.6rem 1.25rem; border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 0.6rem; font-weight: 800; font-size: 0.85rem; transition: all 0.2s; position: relative; }
                    .tab-btn.active { background: #6366f1; color: white; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4); }
                    .orphan-badge { background: #ef4444; color: white; font-size: 0.7rem; padding: 2px 7px; border-radius: 12px; position: absolute; top: -8px; right: -8px; border: 3px solid #1e293b; font-weight: 900; }

                    .cat-main-layout { display: grid; grid-template-columns: 380px 1fr; gap: 2rem; flex: 1; overflow: hidden; }
                    .cat-main-layout:has(.reconciliation-panel) { display: block; }

                    .cat-explorer { background: #0f172a; border: 1px solid #1e293b; border-radius: 24px; padding: 1.5rem; display: flex; flex-direction: column; overflow: hidden; }
                    .search-box { display: flex; align-items: center; gap: 0.75rem; background: #1e293b; padding: 0.8rem 1rem; border-radius: 14px; margin-bottom: 1.5rem; border: 1px solid #334155; }
                    .search-box input { background: transparent; border: none; color: white; outline: none; width: 100%; font-size: 0.9rem; }
                    .tree-container { flex: 1; overflow-y: auto; padding-right: 0.5rem; }
                    .btn-add-root { margin-top: 1.5rem; width: 100%; padding: 1.1rem; background: rgba(99, 102, 241, 0.1); border: 2px dashed #6366f1; color: #818cf8; border-radius: 16px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.6rem; font-size: 0.9rem; transition: 0.2s; }
                    .btn-add-root:hover { background: rgba(99, 102, 241, 0.2); transform: translateY(-2px); }

                    .tree-item { display: flex; align-items: center; gap: 0.6rem; padding: 0.8rem; border-radius: 14px; cursor: pointer; transition: 0.2s; position: relative; }
                    .tree-item:hover { background: rgba(255,255,255,0.05); }
                    .tree-item.selected { background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); }
                    .tree-expander { width: 14px; color: #475569; }
                    .tree-icon { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 8px; }
                    .tree-label { font-size: 0.9rem; font-weight: 600; color: #cbd5e1; }
                    .tree-actions { position: absolute; right: 0.8rem; display: flex; opacity: 0; transition: 0.2s; }
                    .tree-item:hover .tree-actions { opacity: 1; }
                    .tree-actions button { background: #1e293b; border: 1px solid #334155; color: #94a3b8; padding: 5px; border-radius: 8px; cursor: pointer; }
                    .tree-actions button:hover { background: #6366f1; color: white; border-color: #6366f1; }

                    .cat-editor { background: #0f172a; border: 1px solid #1e293b; border-radius: 24px; overflow-y: auto; padding: 3rem; }
                    .editor-header-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
                    .editor-badge { background: rgba(99, 102, 241, 0.1); color: #818cf8; padding: 0.5rem 1.2rem; border-radius: 20px; font-size: 0.75rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; }
                    .btn-add-sub-context { display: flex; align-items: center; gap: 0.6rem; background: #10b981; color: white; border: none; padding: 0.7rem 1.4rem; border-radius: 14px; font-size: 0.85rem; font-weight: 900; cursor: pointer; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }

                    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2.5rem; }
                    .field label { display: block; font-size: 0.7rem; font-weight: 900; color: #475569; text-transform: uppercase; margin-bottom: 0.6rem; }
                    .field input, .field select { width: 100%; background: #1e293b; border: 1px solid #334155; padding: 1rem; border-radius: 14px; color: white; outline: none; font-size: 0.95rem; }
                    .field input:focus { border-color: #6366f1; }
                    
                    .alias-container { display: flex; flex-wrap: wrap; gap: 0.7rem; background: #1e293b; padding: 1.5rem; border-radius: 20px; border: 2px dashed #334155; }
                    .alias-tag { background: #0f172a; border: 1px solid #334155; color: #a5b4fc; padding: 0.5rem 1rem; border-radius: 10px; font-size: 0.85rem; font-weight: 800; display: flex; align-items: center; gap: 0.6rem; }
                    .alias-tag button { background: none; border: none; color: #475569; cursor: pointer; font-size: 1.2rem; line-height: 1; }
                    .alias-input { background: transparent; border: none; color: white; outline: none; font-size: 0.9rem; flex: 1; min-width: 200px; }

                    .section-header { display: flex; align-items: center; gap: 0.75rem; color: #6366f1; margin-bottom: 1.5rem; }
                    .section-header h2 { margin: 0; font-size: 1.1rem; font-weight: 900; color: #f1f5f9; text-transform: uppercase; }
                    .section-tip { color: #64748b; font-size: 0.85rem; margin-bottom: 1.5rem; }

                    .editor-footer { border-top: 1px solid #1e293b; padding-top: 2.5rem; margin-top: 3rem; }
                    .btn-save-full { padding: 1.3rem !important; font-size: 1rem !important; border-radius: 18px !important; font-weight: 900 !important; }
                    .btn-delete-final { background: rgba(248, 113, 113, 0.1); border: 1px solid rgba(248, 113, 113, 0.2); color: #f87171; padding: 0 1.2rem; border-radius: 18px; cursor: pointer; }

                    .reconciliation-panel { background: #0f172a; border: 1px solid #1e293b; border-radius: 32px; padding: 3.5rem; height: 100%; overflow-y: auto; box-shadow: 0 20px 60px -20px rgba(0,0,0,0.6); }
                    .recon-header { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 3.5rem; border-bottom: 1px solid #1e293b; padding-bottom: 2rem; }
                    .recon-header h2 { margin: 0; font-size: 2.2rem; font-weight: 950; color: white; letter-spacing: -0.04em; }
                    .recon-header p { margin: 0.5rem 0 0; color: #64748b; font-size: 1.1rem; font-weight: 500; }

                    .recon-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); gap: 2rem; }
                    .recon-card { background: #1e293b; border: 1px solid #334155; border-radius: 28px; padding: 2rem; border-left: 6px solid #f59e0b; transition: all 0.3s; }
                    .recon-card:hover { transform: translateY(-8px); border-color: #6366f1; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
                    .recon-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
                    .orphan-name { font-size: 1.4rem; font-weight: 900; color: white; font-family: 'JetBrains Mono', monospace; }
                    .orphan-meta { font-size: 0.85rem; color: #94a3b8; margin-top: 0.4rem; }
                    .orphan-meta b { color: #f59e0b; font-weight: 900; }
                    
                    .recon-samples { background: #0f172a; padding: 1.5rem; border-radius: 20px; margin-bottom: 2rem; border: 1px solid #1e293b; }
                    .sample-title { font-size: 0.75rem; color: #475569; font-weight: 900; text-transform: uppercase; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
                    .recon-samples ul { margin: 0; padding-left: 1.5rem; font-size: 0.9rem; color: #cbd5e1; list-style-type: square; }
                    .recon-samples li { margin-bottom: 0.5rem; }

                    .recon-action-zone label { display: block; font-size: 0.8rem; color: #94a3b8; font-weight: 800; margin-bottom: 0.8rem; }
                    .recon-action-zone select { width: 100%; background: #0f172a; border: 2px solid #6366f1; padding: 1.1rem; border-radius: 16px; color: white; outline: none; font-size: 1rem; font-weight: 600; cursor: pointer; }
                    .recon-footer-tip { font-size: 0.7rem; color: #475569; display: flex; align-items: center; gap: 0.5rem; margin-top: 1rem; font-weight: 600; }

                    .recon-empty { text-align: center; padding: 8rem; color: #1e293b; }
                    .recon-empty h3 { color: #334155; font-size: 1.8rem; font-weight: 900; margin-top: 2rem; }
                    .editor-empty { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #1e293b; text-align: center; padding: 4rem; }
                    .editor-empty h3 { color: #334155; margin-top: 1.5rem; font-size: 1.3rem; font-weight: 900; }

                    .btn-refresh-manual { background: #6366f1; color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 14px; font-weight: 800; display: flex; align-items: center; gap: 0.75rem; cursor: pointer; transition: 0.2s; }
                    .btn-refresh-manual:hover:not(:disabled) { background: #4f46e5; transform: scale(1.05); }
                    .btn-refresh-manual:disabled { opacity: 0.5; cursor: not-allowed; }
                    .last-sync { font-size: 0.75rem; color: #475569; font-weight: 700; margin-right: 1.5rem; }
                    .recon-stats { display: flex; align-items: center; }
                    .animate-spin { animation: spin 1s linear infinite; }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                `}</style>
            </div>
        </Layout>
    );
};

export default Categories;
