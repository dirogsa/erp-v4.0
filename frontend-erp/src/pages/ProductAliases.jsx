import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Trash2, ArrowLeft, Database, User, Calendar, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useNotification } from '../hooks/useNotification';
import { useLoading } from '../context/LoadingContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Loading from '../components/common/Loading';

const ProductAliases = () => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const { showLoading, hideLoading } = useLoading();
    
    const [aliases, setAliases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchAliases = async (searchQuery = '') => {
        setLoading(true);
        try {
            const url = searchQuery ? `/intelligence/sincerity/aliases?search=${encodeURIComponent(searchQuery)}` : '/intelligence/sincerity/aliases';
            const res = await api.get(url);
            setAliases(res.data);
        } catch (error) {
            console.error("Error fetching aliases:", error);
            showNotification("Error al cargar el glosario de proveedores", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchAliases(search);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    const handleDelete = async (aliasId, externalCode) => {
        if (!window.confirm(`¿Estás seguro de eliminar el alias para el código '${externalCode}'? Las futuras facturas ya no se auto-mapearán.`)) return;
        
        showLoading("Eliminando alias...");
        try {
            await api.delete(`/intelligence/sincerity/aliases/${aliasId}`);
            showNotification("Alias eliminado correctamente", "success");
            fetchAliases(search);
        } catch (error) {
            console.error("Error deleting alias:", error);
            showNotification(error.response?.data?.message || "Error al eliminar el alias", "error");
        } finally {
            hideLoading();
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const d = new Date(dateString);
        return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
                <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate(-1)}>Volver</Button>
                <div>
                    <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <BookOpen size={32} color="#3b82f6" /> Glosario de Proveedores (Aliases)
                    </h1>
                    <p style={{ color: '#94a3b8', margin: 0, marginTop: '0.5rem' }}>
                        Base de conocimiento del ERP. Define cómo se traducen los códigos de las facturas externas a nuestros SKUs internos.
                    </p>
                </div>
            </div>

            <div style={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: '1px solid #334155', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                        <input 
                            type="text" 
                            placeholder="Buscar por código, SKU, o proveedor..." 
                            value={search} 
                            onChange={(e) => setSearch(e.target.value)} 
                            style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.75rem 1rem 0.75rem 2.75rem', color: 'white' }} 
                        />
                    </div>
                </div>
                
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#1e293b' }}>
                                <th style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.85rem' }}>Origen (XML Proveedor)</th>
                                <th style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.85rem' }}>Traducción (SKU Interno)</th>
                                <th style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.85rem' }}>Trazabilidad</th>
                                <th style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" style={{ padding: '4rem', textAlign: 'center' }}><Loading /></td></tr>
                            ) : aliases.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                                        <Database size={48} style={{ opacity: 0.2, margin: '0 auto', display: 'block', marginBottom: '1rem' }} />
                                        No se encontraron aliases en el diccionario.
                                    </td>
                                </tr>
                            ) : (
                                aliases.map(alias => (
                                    <tr key={alias.id || alias._id} style={{ borderBottom: '1px solid #1e293b' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {alias.external_code}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                                Marca XML: <span style={{ color: 'white' }}>{alias.external_brand || 'N/A'}</span>
                                            </div>
                                            {alias.supplier_name && (
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                                                    Proveedor: {alias.supplier_name}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                {alias.internal_sku}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#e2e8f0', marginTop: '0.25rem' }}>
                                                {alias.internal_product_name || 'Producto Maestro'}
                                            </div>
                                            {alias.internal_brand && (
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                                                    Marca: {alias.internal_brand}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Calendar size={12} /> {formatDate(alias.created_at)}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Tag size={12} /> Usado: <span style={{ color: 'white', fontWeight: 'bold' }}>{alias.usage_count} veces</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: alias.auto_mapped ? '#f59e0b' : '#3b82f6' }}>
                                                    <User size={12} /> {alias.auto_mapped ? 'Auto-Mapeado' : 'Validación Manual'}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                icon={Trash2} 
                                                color="#ef4444"
                                                onClick={() => handleDelete(alias.id || alias._id, alias.external_code)}
                                            >
                                                Desvincular
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProductAliases;
