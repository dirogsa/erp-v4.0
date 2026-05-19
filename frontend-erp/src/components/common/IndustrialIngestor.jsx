import React, { useState, useImperativeHandle, forwardRef, useRef } from 'react';
import Button from './Button';
import { useNotification } from '../../hooks/useNotification';
import { useLoading } from '../../context/LoadingContext';
import { 
    Zap, ShieldCheck, Database, Rocket, Trash2, 
    Search, Info, Upload, FileText, X, Activity,
    CheckCircle2, AlertCircle, Eye, Image, Link2, Car
} from 'lucide-react';

/**
 * IndustrialIngestor: A standardized framework for bulk data ingestion.
 * Built for DIROGSA Tech Industrial 2026.
 */
const IndustrialIngestor = forwardRef(({
    title,
    subtitle,
    icon: Icon = Rocket,
    iconColor = "#eab308",
    onParse,
    onPersist,
    onFilesDetected,
    columns = [],
    placeholder = "Pega aquí los bloques de datos o HTML...",
    ingestionStrategies = [],
    initialStrategy = 'OVERWRITE',
    previewTitle = "Entidades Detectadas",
    processButtonText = "Procesar e Inyectar",
    allowManualClean = true,
    allowFiles = true,
    allowText = true,
    accept = ".html",
    children 
}, ref) => {
    const { showNotification } = useNotification();
    const { showLoading, hideLoading } = useLoading();
    const fileInputRef = useRef();
    
    const [rawText, setRawText] = useState('');
    const [items, setItems] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [strategy, setStrategy] = useState(initialStrategy);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // Exponer métodos imperativos
    useImperativeHandle(ref, () => ({
        addItems: (newItems) => {
            setItems(prev => {
                const filtered = newItems.filter(newItem => 
                    !prev.some(existing => (existing.id && existing.id === newItem.id) || (existing.sku && existing.sku === newItem.sku))
                );
                return [...prev, ...filtered];
            });
        },
        clear: () => setItems([])
    }));

    const handleDetect = async () => {
        if (!rawText.trim()) return;
        
        setIsProcessing(true);
        try {
            const detected = await onParse(rawText);
            if (detected && detected.length > 0) {
                const filtered = detected.filter(newItem => 
                    !items.some(existing => (existing.id && existing.id === newItem.id) || (existing.sku && existing.sku === newItem.sku))
                );
                setItems(prev => [...prev, ...filtered]);
                showNotification(`Se detectaron ${detected.length} entidades.`, 'success');
                setRawText('');
            } else {
                showNotification('No se detectaron datos válidos.', 'warning');
            }
        } catch (err) {
            showNotification(`Error: ${err.message}`, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFileEvent = async (e) => {
        const files = Array.from(e.target?.files || e.dataTransfer?.files || []);
        if (files.length === 0) return;
        
        if (onFilesDetected) {
            setIsProcessing(true);
            try {
                await onFilesDetected(files);
            } catch (err) {
                showNotification(`Error procesando archivos: ${err.message}`, 'error');
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleBulkUpload = async () => {
        if (items.length === 0) return;
        setIsProcessing(true);
        showLoading(`Iniciando Ingesta Industrial...`, `Procesando ${items.length} registros.`);
        try {
            await onPersist(items, strategy);
            setItems([]);
            showNotification('Ingesta completada.', 'success');
        } catch (error) {
            showNotification(`Error: ${error.message}`, 'error');
        } finally {
            setIsProcessing(false);
            hideLoading();
        }
    };

    // Telemetría de Catálogo
    const getSummary = () => {
        const total = items.length;
        const withImage = items.filter(i => i.image_url && i.image_url.length > 0).length;
        const withEquiv = items.filter(i => i.equivalences && i.equivalences.length > 0).length;
        return { total, withImage, withEquiv };
    };

    const summary = getSummary();

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ color: 'white', margin: 0, fontSize: '2rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '0.85rem', letterSpacing: '-0.02em' }}>
                        <div style={{ padding: '0.6rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <Icon size={28} color={iconColor} />
                        </div>
                        {title}
                    </h1>
                    <p style={{ color: '#64748b', marginTop: '0.6rem', fontSize: '1rem', fontWeight: '500' }}>{subtitle}</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {items.length > 0 && ingestionStrategies.length > 0 && (
                        <div style={{ display: 'flex', background: '#0f172a', padding: '0.35rem', borderRadius: '1rem', border: '1px solid #334155', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                            {ingestionStrategies.map(s => (
                                <Button 
                                    key={s.value}
                                    variant={strategy === s.value ? 'primary' : 'ghost'}
                                    size="small"
                                    onClick={() => setStrategy(s.value)}
                                    style={{ borderRadius: '0.75rem' }}
                                >
                                    {s.label}
                                </Button>
                            ))}
                        </div>
                    )}
                    {items.length > 0 && (
                        <Button 
                            variant="warning" 
                            icon={Database} 
                            onClick={handleBulkUpload} 
                            loading={isProcessing}
                            style={{ 
                                padding: '0.75rem 1.5rem', 
                                fontSize: '1rem', 
                                fontWeight: '800',
                                boxShadow: `0 0 20px ${iconColor}33`,
                                border: `1px solid ${iconColor}66`
                            }}
                        >
                            {processButtonText} ({items.length})
                        </Button>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: (allowFiles && allowText) ? '1fr 1.2fr' : '1fr', gap: '2.5rem' }}>
                {/* ZONA DE ARCHIVOS (OPCIONAL) */}
                {allowFiles && (
                    <div 
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileEvent(e); }}
                        onClick={() => fileInputRef.current.click()}
                        style={{ 
                            border: `2px dashed ${isDragging ? iconColor : '#334155'}`, 
                            borderRadius: '2rem', 
                            padding: '5rem 2rem', 
                            textAlign: 'center', 
                            background: isDragging 
                                ? 'rgba(234, 179, 8, 0.08)' 
                                : 'linear-gradient(145deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)', 
                            backdropFilter: 'blur(10px)',
                            cursor: 'pointer',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '2rem',
                            minHeight: allowText ? 'auto' : '350px',
                            boxShadow: isDragging ? `0 0 40px ${iconColor}11` : 'none',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        <input type="file" ref={fileInputRef} multiple accept={accept} style={{ display: 'none' }} onChange={handleFileEvent} />
                        
                        {/* Acento Industrial Decorativo */}
                        <div style={{ position: 'absolute', top: 0, left: 0, padding: '1rem', opacity: 0.1 }}>
                            <Activity size={100} color={iconColor} />
                        </div>

                        <div style={{ 
                            width: '100px', height: '100px', 
                            background: `linear-gradient(135deg, ${iconColor}22 0%, ${iconColor}11 100%)`, 
                            borderRadius: '2.5rem', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: isDragging ? `0 0 30px ${iconColor}44` : `0 10px 20px rgba(0,0,0,0.2)`,
                            border: `1px solid ${iconColor}33`,
                            transform: isDragging ? 'scale(1.1) rotate(5deg)' : 'none',
                            transition: 'all 0.4s ease'
                        }}>
                            <Upload size={42} color={iconColor} />
                        </div>
                        <div>
                            <h3 style={{ color: 'white', margin: '0 0 0.75rem 0', fontSize: '1.6rem', fontWeight: '900', letterSpacing: '-0.02em' }}>
                                Carga Industrial de Archivos {accept.toUpperCase()}
                            </h3>
                            <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '450px', margin: '0 auto', lineHeight: '1.6' }}>
                                Arrastra tus archivos de auditoría o haz clic para buscarlos en tu repositorio local.
                            </p>
                        </div>
                        {isProcessing && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: iconColor, fontWeight: '900', fontSize: '0.95rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem 1.25rem', borderRadius: '2rem', border: `1px solid ${iconColor}44` }}>
                                <div className="spinner" style={{ width: '18px', height: '18px', border: `3px solid ${iconColor}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                ANALIZANDO ESTRUCTURA...
                            </div>
                        )}
                    </div>
                )}

                {/* ZONA DE TEXTO / MANUAL (OPCIONAL) */}
                {allowText && (
                    <div style={{ background: '#1e293b', borderRadius: '2rem', border: '1px solid #334155', padding: '2.5rem', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                <label style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    Entrada Manual de Datos
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: '600' }}>
                                    <Info size={16} />
                                    <span>Buffer de texto directo</span>
                                </div>
                            </div>
                            <textarea
                                value={rawText}
                                onChange={(e) => setRawText(e.target.value)}
                                placeholder={placeholder}
                                style={{ 
                                    width: '100%', height: '200px', 
                                    backgroundColor: '#0f172a', 
                                    border: '1px solid #334155', 
                                    borderRadius: '1.25rem', 
                                    color: '#e2e8f0', 
                                    padding: '1.5rem', 
                                    fontSize: '0.9rem', 
                                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace", 
                                    outline: 'none',
                                    resize: 'none',
                                    transition: 'all 0.3s'
                                }}
                                onFocus={(e) => { e.target.style.borderColor = iconColor; e.target.style.boxShadow = `0 0 0 4px ${iconColor}11`; }}
                                onBlur={(e) => { e.target.style.borderColor = '#334155'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>
                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <Button 
                                variant="secondary" 
                                icon={Search} 
                                onClick={handleDetect} 
                                loading={isProcessing} 
                                disabled={!rawText.trim()}
                                style={{ borderRadius: '1rem', padding: '0.75rem 2rem' }}
                            >
                                Detectar Entidades
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {children && <div style={{ marginTop: '2.5rem' }}>{children}</div>}

            {items.length > 0 && (
                <div style={{ marginTop: '3.5rem', animation: 'slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                    {/* Panel de Telemetría */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid #334155', borderRadius: '1.25rem', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '45px', height: '45px', borderRadius: '1rem', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FileText color="#3b82f6" size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '900', lineHeight: '1' }}>{summary.total}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', marginTop: '0.2rem' }}>Entidades Totales</div>
                            </div>
                        </div>
                        <div style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid #334155', borderRadius: '1.25rem', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '45px', height: '45px', borderRadius: '1rem', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Image color="#10b981" size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '900', lineHeight: '1', color: summary.withImage === summary.total ? '#10b981' : '#eab308' }}>{summary.withImage}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', marginTop: '0.2rem' }}>Con Imagen HD</div>
                            </div>
                        </div>
                        <div style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid #334155', borderRadius: '1.25rem', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '45px', height: '45px', borderRadius: '1rem', background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Link2 color="#a855f7" size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '900', lineHeight: '1' }}>{summary.withEquiv}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', marginTop: '0.2rem' }}>Con Equivalencias</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ background: '#1e293b', borderRadius: '1.5rem', border: '1px solid #334155', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                        <div style={{ padding: '1.5rem 2rem', background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 12px #10b981', animation: 'pulse 2s infinite' }} />
                                <h3 style={{ color: 'white', margin: 0, fontSize: '1.1rem', fontWeight: '900', letterSpacing: '-0.01em' }}>{previewTitle}</h3>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <Button 
                                    variant="warning" 
                                    icon={Database} 
                                    onClick={handleBulkUpload} 
                                    loading={isProcessing}
                                    size="sm"
                                    style={{ 
                                        fontWeight: '800',
                                        boxShadow: `0 0 10px ${iconColor}33`,
                                        border: `1px solid ${iconColor}66`
                                    }}
                                >
                                    {processButtonText}
                                </Button>
                                {allowManualClean && (
                                    <button onClick={() => setItems([])} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '800', padding: '0.5rem 1rem', borderRadius: '0.75rem', transition: 'all 0.2s' }}>
                                        <Trash2 size={16} /> LIMPIAR BUFFER
                                    </button>
                                )}
                            </div>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
                                        {columns.map((col, idx) => (
                                            <th key={idx} style={{ padding: '1.25rem 2rem', textAlign: col.align || 'left', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: '900' }}>{col.label}</th>
                                        ))}
                                        <th style={{ padding: '1.25rem 2rem' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, idx) => (
                                        <tr key={idx} style={{ borderTop: '1px solid #33415555', transition: 'all 0.2s', cursor: 'pointer' }} className="table-row-hover" onClick={() => setSelectedItem(item)}>
                                            {columns.map((col, cIdx) => (
                                                <td key={cIdx} style={{ padding: '1.5rem 2rem', textAlign: col.align || 'left', fontSize: '0.95rem' }}>
                                                    {col.render ? col.render(item[col.key], item) : item[col.key]}
                                                </td>
                                            ))}
                                            <td style={{ padding: '1.5rem 2rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }} 
                                                    style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '0.6rem', borderRadius: '0.75rem', cursor: 'pointer', transition: 'all 0.3s' }}
                                                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'; }}
                                                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)'; }}
                                                    title="Inspeccionar datos extraídos"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setItems(prev => prev.filter((_, i) => i !== idx)); }} 
                                                    style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.6rem', borderRadius: '0.75rem', cursor: 'pointer', transition: 'all 0.3s' }}
                                                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
                                                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'; }}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            
            {/* ═══ DRAWER DE INSPECCIÓN ═══ */}
            {selectedItem && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', justifyContent: 'flex-end' }}>
                    <div onClick={() => setSelectedItem(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease' }} />
                    <div style={{ position: 'relative', width: '580px', maxWidth: '95vw', height: '100vh', background: '#0f172a', borderLeft: '1px solid #334155', overflowY: 'auto', animation: 'slideRight 0.3s ease', boxShadow: '-20px 0 60px rgba(0,0,0,0.5)' }}>
                        {/* Header */}
                        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #334155', background: '#1e293b', position: 'sticky', top: 0, zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#eab308' }}>{selectedItem.sku}</div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>{selectedItem.brand} · {selectedItem.category_name}</div>
                            </div>
                            <button onClick={() => setSelectedItem(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #334155', color: '#94a3b8', padding: '0.5rem', borderRadius: '0.75rem', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {/* Imagen HD */}
                            <div>
                                <div style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Image size={14} /> Imagen Extraída
                                </div>
                                {selectedItem.image_url ? (
                                    <div style={{ background: '#1e293b', borderRadius: '1rem', border: '1px solid #334155', padding: '1rem', textAlign: 'center' }}>
                                        <img src={selectedItem.image_url} alt={selectedItem.sku} style={{ maxWidth: '100%', maxHeight: '220px', objectFit: 'contain', borderRadius: '0.5rem' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                                        <div style={{ display: 'none', color: '#ef4444', fontSize: '0.85rem', padding: '1rem' }}>⚠ Imagen no disponible en origen</div>
                                        <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '0.5rem', wordBreak: 'break-all' }}>{selectedItem.image_url}</div>
                                    </div>
                                ) : (
                                    <div style={{ background: '#1e293b', borderRadius: '1rem', border: '1px dashed #475569', padding: '2rem', textAlign: 'center', color: '#475569' }}>Sin imagen detectada</div>
                                )}
                            </div>

                            {/* Specs */}
                            {selectedItem.specs && selectedItem.specs.length > 0 && (
                                <div>
                                    <div style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Activity size={14} /> Especificaciones ({selectedItem.specs.length})
                                    </div>
                                    <div style={{ background: '#1e293b', borderRadius: '1rem', border: '1px solid #334155', overflow: 'hidden' }}>
                                        {selectedItem.specs.map((spec, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 1rem', borderBottom: i < selectedItem.specs.length - 1 ? '1px solid #33415555' : 'none', fontSize: '0.85rem' }}>
                                                <span style={{ color: '#94a3b8' }}>{spec.label}</span>
                                                <span style={{ color: 'white', fontWeight: '700', fontFamily: "'JetBrains Mono', monospace" }}>{spec.value} {spec.measure_type === 'mm' ? 'mm' : ''}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Equivalencias */}
                            {selectedItem.equivalences && selectedItem.equivalences.length > 0 && (
                                <div>
                                    <div style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Link2 size={14} /> Equivalencias ({selectedItem.equivalences.length})
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {selectedItem.equivalences.map((eq, i) => (
                                            <span key={i} style={{ background: eq.is_original ? 'rgba(234,179,8,0.1)' : 'rgba(59,130,246,0.1)', border: `1px solid ${eq.is_original ? '#eab30833' : '#3b82f633'}`, color: eq.is_original ? '#eab308' : '#93c5fd', padding: '0.35rem 0.75rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: '700', fontFamily: "'JetBrains Mono', monospace" }}>
                                                {eq.brand}: {eq.code} {eq.is_original ? '★' : ''}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Aplicaciones */}
                            {selectedItem.applications && selectedItem.applications.length > 0 && (
                                <div>
                                    <div style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Car size={14} /> Aplicaciones ({selectedItem.applications.length})
                                    </div>
                                    <div style={{ background: '#1e293b', borderRadius: '1rem', border: '1px solid #334155', overflow: 'hidden', maxHeight: '300px', overflowY: 'auto' }}>
                                        {selectedItem.applications.map((app, i) => (
                                            <div key={i} style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #33415555', fontSize: '0.8rem' }}>
                                                <div style={{ fontWeight: '700', color: 'white' }}>{app.make} › {app.model}</div>
                                                <div style={{ color: '#64748b', marginTop: '0.15rem' }}>{app.year}{app.engine ? ` · ${app.engine}` : ''}{app.notes ? ` · ${app.notes}` : ''}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Metadatos */}
                            <div>
                                <div style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.75rem' }}>Metadatos</div>
                                <div style={{ background: '#1e293b', borderRadius: '1rem', border: '1px solid #334155', overflow: 'hidden' }}>
                                    {[
                                        { k: 'Nombre', v: selectedItem.name },
                                        { k: 'Peso', v: selectedItem.weight_g ? `${selectedItem.weight_g}g` : '—' },
                                        { k: 'Forma', v: selectedItem.shape || '—' },
                                        { k: 'EAN', v: selectedItem.ean || '—' },
                                        { k: 'Estado', v: selectedItem.status || '—' },
                                    ].filter(m => m.v).map((m, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid #33415555', fontSize: '0.8rem' }}>
                                            <span style={{ color: '#64748b' }}>{m.k}</span>
                                            <span style={{ color: '#e2e8f0', fontWeight: '600' }}>{m.v}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } 100% { opacity: 1; transform: scale(1); } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slideRight { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .spinner { border-radius: 50%; border: 3px solid transparent; border-top-color: currentColor; animation: spin 0.8s linear infinite; }
                .table-row-hover:hover { background: rgba(255, 255, 255, 0.02); }
            `}</style>
        </div>
    );
});

export default IndustrialIngestor;
