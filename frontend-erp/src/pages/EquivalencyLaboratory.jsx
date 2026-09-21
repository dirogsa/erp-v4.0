import React, { useState, useEffect, useRef } from 'react';
import { dimsService } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import IndustrialIngestor from '../components/common/IndustrialIngestor';
import { GitCompare, Search, ShieldCheck, Layers, Cpu, CheckCircle2, AlertCircle, Database, ArrowRight, Eye, RefreshCw } from 'lucide-react';

const EquivalencyLaboratory = () => {
    const { showNotification } = useNotification();
    const ingestorRef = useRef();

    // Active View Tab - Iniciar en pestaña para ingresar nueva equivalencia
    const [activeTab, setActiveTab] = useState('ingest'); // 'ingest' | 'catalog'

    // Reference Catalog State (On-Demand Search-First)
    const [refProducts, setRefProducts] = useState([]);
    const [refLoading, setRefLoading] = useState(false);
    const [refPage, setRefPage] = useState(1);
    const [refTotalPages, setRefTotalPages] = useState(1);
    const [refTotalCount, setRefTotalCount] = useState(0);
    const [refSearch, setRefSearch] = useState('');
    const [hasExecutedSearch, setHasExecutedSearch] = useState(false);

    // Search Engine State (Algoritmo 3)
    const [searchSku, setSearchSku] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [equivResults, setEquivResults] = useState(null);

    // Consulta directa y estricta a demanda (Server-side real-time, sin caché artificial)
    const executeSearch = async (page = 1, query = refSearch) => {
        setRefLoading(true);
        setHasExecutedSearch(true);
        try {
            const res = await dimsService.getReferenceProducts(page, 50, query, '');
            const data = res.data || {};
            setRefProducts(data.items || []);
            setRefTotalPages(data.pages || 1);
            setRefTotalCount(data.total || 0);
            setRefPage(data.page || 1);
        } catch (err) {
            console.error("Error consultando catálogo de referencias:", err);
            showNotification("Error consultando el catálogo de referencias", "error");
        } finally {
            setRefLoading(false);
        }
    };

    // Motor de Parsing y Detección de Archivos JSON
    const handleFiles = async (files) => {
        const detected = [];
        for (const file of files) {
            try {
                const text = await file.text();
                const json = JSON.parse(text);

                const data = json.product || json;
                const sku = data.item_code || data.sku || file.name.replace(/\.json$/i, '');
                const brand = data.pref || data.brand || 'GENERIC';
                const name = data.name || `Filtro ${sku}`;

                // Extraer conteo de especificaciones y cruces
                const oems = data.oems || [];
                const refs = data.refs || [];
                const tc_infos = data.tc_infos?.en || data.info || [];
                const apps = data.car_model_types || [];

                detected.push({
                    id: sku,
                    sku: sku,
                    brand: brand,
                    name: name,
                    specs_count: tc_infos.length,
                    equivalences_count: oems.length + refs.length,
                    applications_count: apps.length,
                    raw_data: json
                });
            } catch (err) {
                console.error(`Error leyendo archivo JSON ${file.name}:`, err);
            }
        }

        if (detected.length > 0 && ingestorRef.current) {
            ingestorRef.current.addItems(detected);
        }
    };

    // Motor de Persistencia hacia el Backend (/api/v1/dims/import/batch)
    const handlePersist = async (items) => {
        try {
            const payloads = items.map(item => item.raw_data || item);
            const response = await dimsService.importBatch(payloads);
            const res = response.data || {};

            const imported = res.imported || 0;
            const updated = res.updated || 0;
            const errorsCount = res.errors?.length || 0;

            if (errorsCount === 0) {
                showNotification(
                    `Lote procesado con éxito: ${imported} referencias nuevas creadas y ${updated} actualizadas en el grafo relacional.`,
                    'success',
                    { mode: 'dialog' }
                );
            } else {
                showNotification(
                    `Procesado con advertencias: ${imported} creadas, ${updated} actualizadas, ${errorsCount} observaciones registradas.`,
                    'warning',
                    { mode: 'dialog' }
                );
            }
        } catch (error) {
            console.error('Error inyectando lote DIMS:', error);
            showNotification(error.message || 'Error en la importación masiva de equivalencias', 'error', { mode: 'dialog' });
        }
    };

    // Búsqueda en Grafo / Algoritmo 3
    const handleSearch = async () => {
        if (!searchSku.trim()) return;
        setIsSearching(true);
        setEquivResults(null);
        try {
            const response = await dimsService.getEquivalencies(searchSku.trim());
            setEquivResults(response.data);
            showNotification('Búsqueda en grafo completada', 'success');
        } catch (error) {
            console.error('Error buscando equivalencias:', error);
            showNotification(error.message || 'No se encontraron cruces para este SKU.', 'error');
        } finally {
            setIsSearching(false);
        }
    };

    const columns = [
        {
            label: 'Identificador (SKU / Ref)',
            key: 'sku',
            render: (val, row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ padding: '0.45rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                        <GitCompare size={16} color="#6366f1" />
                    </div>
                    <div>
                        <div style={{ fontWeight: '800', color: '#818cf8', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.95rem' }}>
                            {val}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>
                            {row.brand}
                        </div>
                    </div>
                </div>
            )
        },
        {
            label: 'Descripción Técnica',
            key: 'name',
            render: (val) => <span style={{ color: '#e2e8f0', fontWeight: '600', fontSize: '0.85rem' }}>{val}</span>
        },
        {
            label: 'Grafo Relacional Detectado',
            key: 'metrics',
            render: (_, row) => (
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '0.2rem 0.55rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: '700' }}>
                        🔗 {row.equivalences_count || 0} Cruces
                    </span>
                    <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.2rem 0.55rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: '700' }}>
                        📏 {row.specs_count || 0} Medidas
                    </span>
                    <span style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '0.2rem 0.55rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: '700' }}>
                        🚗 {row.applications_count || 0} Autos
                    </span>
                </div>
            )
        },
        {
            label: 'Tipo Asignado',
            key: 'type',
            render: () => (
                <span style={{
                    fontSize: '0.65rem',
                    fontWeight: '800',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '0.375rem',
                    background: 'rgba(56, 189, 248, 0.1)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    letterSpacing: '0.05em'
                }}>
                    REFERENCE (RELACIONAL)
                </span>
            )
        }
    ];

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', color: '#f8fafc', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                        <Cpu size={28} color="#6366f1" />
                        Laboratorio de Equivalencias (Motor DIMS 3.0)
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                        Matriz de grafos, banco de pruebas de cruces OEM/Aftermarket y catálogo de referencias puras.
                    </p>
                </div>

                {/* Pestañas Superiores: Nueva Equivalencia / Inyector PRIMERO */}
                <div style={{ display: 'flex', background: '#0f172a', padding: '0.35rem', borderRadius: '0.75rem', border: '1px solid #334155', gap: '0.35rem' }}>
                    <button
                        onClick={() => setActiveTab('ingest')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.6rem 1.1rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            background: activeTab === 'ingest' ? '#6366f1' : 'transparent',
                            color: activeTab === 'ingest' ? 'white' : '#94a3b8',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <GitCompare size={16} />
                        Ingresar Nuevas Equivalencias (JSON)
                    </button>
                    <button
                        onClick={() => setActiveTab('catalog')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.6rem 1.1rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            background: activeTab === 'catalog' ? '#6366f1' : 'transparent',
                            color: activeTab === 'catalog' ? 'white' : '#94a3b8',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <Database size={16} />
                        Consultar Referencias ({refTotalCount > 0 ? refTotalCount : 'Búsqueda'})
                    </button>
                </div>
            </div>

            {/* TAB 1: INYECTOR MASIVO INDUSTRIAL (POR DEFECTO PRIMERO) */}
            {activeTab === 'ingest' && (
                <div style={{ marginBottom: '2.5rem' }}>
                    <IndustrialIngestor
                        ref={ingestorRef}
                        title="Inyector de Grafos Técnicos (JSON)"
                        subtitle="Carga y previsualiza archivos JSON de la industria para enriquecer la matriz de equivalencias directas"
                        icon={GitCompare}
                        iconColor="#6366f1"
                        onFilesDetected={handleFiles}
                        onPersist={async (items) => {
                            await handlePersist(items);
                        }}
                        columns={columns}
                        previewTitle="Referencias y Cruces Detectados en Archivos JSON"
                        processButtonText="Inyectar al Grafo DIMS"
                        allowText={false}
                        accept=".json"
                    />
                </div>
            )}

            {/* TAB 2: CONSULTAR REFERENCIAS (SEARCH-FIRST ON-DEMAND) */}
            {activeTab === 'catalog' && (
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '1rem', padding: '1.5rem', marginBottom: '2.5rem' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', color: '#f8fafc', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Database size={20} color="#6366f1" />
                            Consulta de Referencias Técnicas (MongoDB)
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                            Búsqueda directa bajo demanda de productos y cruces relacionales almacenados en la base de datos.
                        </p>
                    </div>

                    {/* Barra de Búsqueda Principal */}
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                        <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
                            <input
                                type="text"
                                placeholder="Buscar por código (ej. SB2152, SCT, W712, 17801...)"
                                value={refSearch}
                                onChange={(e) => setRefSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && executeSearch(1, refSearch)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    background: '#0f172a',
                                    color: '#f8fafc',
                                    border: '1px solid #334155',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                        <button
                            onClick={() => executeSearch(1, refSearch)}
                            disabled={refLoading}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: '#6366f1',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                fontWeight: '700',
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Search size={16} />
                            {refLoading ? 'Buscando...' : 'Buscar en BD'}
                        </button>
                        <button
                            onClick={() => { setRefSearch(''); executeSearch(1, ''); }}
                            disabled={refLoading}
                            style={{
                                padding: '0.75rem 1.25rem',
                                background: '#334155',
                                color: '#cbd5e1',
                                border: 'none',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '0.85rem'
                            }}
                        >
                            Ver Todas ({refTotalCount > 0 ? refTotalCount : 'Explorar'})
                        </button>
                    </div>

                    {/* Estado: Cargando */}
                    {refLoading && (
                        <div style={{ padding: '3.5rem', textAlign: 'center', color: '#94a3b8' }}>
                            <div style={{ display: 'inline-block', marginBottom: '0.75rem' }}>
                                <RefreshCw size={24} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                            </div>
                            <div>Consultando base de datos en MongoDB...</div>
                        </div>
                    )}

                    {/* Estado: No ha buscado todavía */}
                    {!refLoading && !hasExecutedSearch && (
                        <div style={{
                            padding: '3rem 2rem',
                            textAlign: 'center',
                            background: '#0f172a',
                            borderRadius: '0.75rem',
                            border: '1px dashed #334155'
                        }}>
                            <Search size={36} color="#64748b" style={{ margin: '0 auto 1rem auto' }} />
                            <h3 style={{ color: '#cbd5e1', fontSize: '1.05rem', margin: '0 0 0.5rem 0', fontWeight: '600' }}>
                                Consulta bajo demanda activa
                            </h3>
                            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0, maxWidth: '520px', marginLeft: 'auto', marginRight: 'auto' }}>
                                Para ahorrar recursos del sistema, la lista no se precarga automáticamente. Escribe un código o haz clic en <strong>"Ver Todas"</strong> para consultar los registros directamente desde la base de datos.
                            </p>
                        </div>
                    )}

                    {/* Estado: Búsqueda ejecutada sin resultados */}
                    {!refLoading && hasExecutedSearch && refProducts.length === 0 && (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                            No se encontraron referencias que coincidan con la búsqueda.
                        </div>
                    )}

                    {/* Estado: Búsqueda ejecutada con resultados */}
                    {!refLoading && hasExecutedSearch && refProducts.length > 0 && (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #334155', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        <th style={{ padding: '0.75rem 0.5rem' }}>SKU Referencia</th>
                                        <th style={{ padding: '0.75rem 0.5rem' }}>Marca</th>
                                        <th style={{ padding: '0.75rem 0.5rem' }}>Descripción Técnica</th>
                                        <th style={{ padding: '0.75rem 0.5rem' }}>Grafo Relacional</th>
                                        <th style={{ padding: '0.75rem 0.5rem' }}>Códigos Muestra</th>
                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Probar Cruce</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {refProducts.map((p) => (
                                        <tr key={p.id} style={{ borderBottom: '1px solid #334155' }}>
                                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: '800', color: '#818cf8', fontFamily: "'JetBrains Mono', monospace" }}>
                                                {p.sku}
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem', color: '#f8fafc', fontWeight: '700' }}>
                                                {p.brand}
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem', color: '#cbd5e1', fontSize: '0.85rem' }}>
                                                {p.name}
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem' }}>
                                                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                                    <span style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '0.15rem 0.45rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: '700' }}>
                                                        🔗 {p.equivalences_count} Cruces
                                                    </span>
                                                    <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.15rem 0.45rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: '700' }}>
                                                        📏 {p.specs_count} Medidas
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem' }}>
                                                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                                                    {p.equivalences_sample?.map((c, i) => (
                                                        <span key={i} style={{ background: '#0f172a', color: '#94a3b8', border: '1px solid #334155', padding: '0.15rem 0.4rem', borderRadius: '3px', fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace" }}>
                                                            {c}
                                                        </span>
                                                    ))}
                                                    {p.equivalences_count > 5 && (
                                                        <span style={{ color: '#64748b', fontSize: '0.7rem' }}>+{p.equivalences_count - 5}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                                                <button
                                                    onClick={() => {
                                                        setSearchSku(p.sku);
                                                        const el = document.getElementById('validator-section');
                                                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                                                    }}
                                                    style={{
                                                        padding: '0.35rem 0.75rem',
                                                        background: 'rgba(59, 130, 246, 0.15)',
                                                        color: '#60a5fa',
                                                        border: '1px solid rgba(59, 130, 246, 0.3)',
                                                        borderRadius: '0.375rem',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '700',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Probar 🔍
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Paginador */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #334155', fontSize: '0.85rem', color: '#94a3b8' }}>
                                <span>Página {refPage} de {refTotalPages} (Total: {refTotalCount} resultados)</span>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        disabled={refPage <= 1}
                                        onClick={() => executeSearch(refPage - 1, refSearch)}
                                        style={{ padding: '0.4rem 0.8rem', background: '#334155', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: refPage <= 1 ? 'not-allowed' : 'pointer', opacity: refPage <= 1 ? 0.5 : 1 }}
                                    >
                                        Anterior
                                    </button>
                                    <button
                                        disabled={refPage >= refTotalPages}
                                        onClick={() => executeSearch(refPage + 1, refSearch)}
                                        style={{ padding: '0.4rem 0.8rem', background: '#334155', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: refPage >= refTotalPages ? 'not-allowed' : 'pointer', opacity: refPage >= refTotalPages ? 0.5 : 1 }}
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Banco de Pruebas de Algoritmo 3 */}
            <div id="validator-section" style={{
                marginTop: '2.5rem',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '1rem',
                padding: '1.75rem',
                boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.3)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <Search size={22} color="#3b82f6" />
                    <h2 style={{ fontSize: '1.25rem', color: '#f8fafc', fontWeight: '700', margin: 0 }}>
                        Validador en Vivo: Algoritmo 3 (Cruces Directos 360°)
                    </h2>
                </div>
                <p style={{ color: '#94a3b8', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                    Ingresa cualquier código (OEM, Aftermarket o propio) para validar en tiempo real el árbol de sustitutos y códigos compartidos.
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Ejemplo: SCT_SB2466, W712, 17801-21050..."
                        value={searchSku}
                        onChange={(e) => setSearchSku(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        style={{
                            flex: 1,
                            minWidth: '280px',
                            padding: '0.75rem 1rem',
                            background: '#0f172a',
                            color: '#f8fafc',
                            border: '1px solid #334155',
                            borderRadius: '0.5rem',
                            outline: 'none',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '0.95rem'
                        }}
                    />
                    <button
                        onClick={handleSearch}
                        disabled={!searchSku.trim() || isSearching}
                        style={{
                            padding: '0.75rem 1.75rem',
                            background: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontWeight: '700',
                            fontSize: '0.9rem',
                            cursor: (!searchSku.trim() || isSearching) ? 'not-allowed' : 'pointer',
                            opacity: (!searchSku.trim() || isSearching) ? 0.6 : 1,
                            transition: 'background 0.2s',
                            boxShadow: '0 2px 10px rgba(37, 99, 235, 0.3)'
                        }}
                    >
                        {isSearching ? 'Consultando Grafo...' : 'Buscar Equivalencias'}
                    </button>
                </div>

                {equivResults && (
                    <div style={{
                        marginTop: '1.5rem',
                        background: '#0f172a',
                        padding: '1.25rem',
                        borderRadius: '0.75rem',
                        border: '1px solid #334155'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ color: '#60a5fa', fontWeight: '800', fontSize: '1rem' }}>
                                Grafo para: <span style={{ color: 'white', fontFamily: "'JetBrains Mono', monospace" }}>{equivResults.source_sku}</span>
                            </div>
                            <span style={{
                                background: 'rgba(59, 130, 246, 0.15)',
                                color: '#93c5fd',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '9999px',
                                fontSize: '0.8rem',
                                fontWeight: '700'
                            }}>
                                {equivResults.total_matches || 0} Coincidencias Directas
                            </span>
                        </div>

                        {equivResults.equivalencies && equivResults.equivalencies.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #334155', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            <th style={{ padding: '0.75rem 0.5rem' }}>SKU Sustituto</th>
                                            <th style={{ padding: '0.75rem 0.5rem' }}>Marca</th>
                                            <th style={{ padding: '0.75rem 0.5rem' }}>Descripción</th>
                                            <th style={{ padding: '0.75rem 0.5rem' }}>Códigos Compartidos (OEM/Ref)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {equivResults.equivalencies.map((eq, i) => (
                                            <tr key={eq.sku || i} style={{ borderBottom: '1px solid #1e293b' }}>
                                                <td style={{ padding: '0.75rem 0.5rem', fontWeight: '800', color: '#38bdf8', fontFamily: "'JetBrains Mono', monospace" }}>
                                                    {eq.sku}
                                                </td>
                                                <td style={{ padding: '0.75rem 0.5rem', color: '#f8fafc', fontWeight: '700' }}>
                                                    {eq.brand}
                                                </td>
                                                <td style={{ padding: '0.75rem 0.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                                                    {eq.name}
                                                </td>
                                                <td style={{ padding: '0.75rem 0.5rem' }}>
                                                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                        {eq.shared_codes.map((c, idx) => (
                                                            <span key={idx} style={{
                                                                background: 'rgba(59, 130, 246, 0.15)',
                                                                color: '#60a5fa',
                                                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                                                padding: '0.2rem 0.5rem',
                                                                borderRadius: '4px',
                                                                fontSize: '0.75rem',
                                                                fontFamily: "'JetBrains Mono', monospace"
                                                            }}>
                                                                {c}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0.5rem 0' }}>
                                No se encontraron equivalencias directas para este SKU.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EquivalencyLaboratory;
