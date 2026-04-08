import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { financeService } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import Button from '../components/common/Button';
import { 
    ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
    Download, ClipboardList, Info, AlertTriangle, 
    Save, CheckCircle2, Trash2
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const ExchangeRates = () => {
    const { showNotification } = useNotification();
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewDate, setViewDate] = useState(new Date()); // Fecha actual para el calendario
    const [showPasteModal, setShowPasteModal] = useState(false);
    const [sunatText, setSunatText] = useState('');
    const [parsedData, setParsedData] = useState([]);
    const [isSavingBatch, setIsSavingBatch] = useState(false);

    // Metadata del calendario
    const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const fetchRates = async () => {
        setLoading(true);
        try {
            // Obtenemos un rango amplio para cubrir el mes actual
            const response = await financeService.getExchangeRates();
            setRates(response.data);
        } catch (error) {
            console.error('Error fetching rates:', error);
            showNotification('Error al cargar historial', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRates();
    }, []);

    // Lógica de Calendario
    const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

    const currentMonth = viewDate.getMonth();
    const currentYear = viewDate.getFullYear();
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

    // Filtrar rates para el calendario
    const getRateForDay = (day) => {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return rates.find(r => r.date.startsWith(dateStr));
    };

    const handleMonthChange = (offset) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setViewDate(newDate);
    };

    // Parser SUNAT
    const processSunatPaste = () => {
        // Regex para capturar: Día + Compra + Valor + Venta + Valor
        const regex = /(\d+)\s+Compra\s+([\d.]+)\s+Venta\s+([\d.]+)/g;
        const matches = [];
        let match;
        
        while ((match = regex.exec(sunatText)) !== null) {
            matches.push({
                day: parseInt(match[1]),
                purchase: parseFloat(match[2]),
                sale: parseFloat(match[3])
            });
        }

        if (matches.length === 0) {
            showNotification("No se detectó formato válido de SUNAT en el texto.", "warning");
            return;
        }

        setParsedData(matches);
        showNotification(`Detectados ${matches.length} días de SUNAT. Revise y guarde.`, "success");
    };

    const saveParsedBatch = async () => {
        setIsSavingBatch(true);
        try {
            for (const item of parsedData) {
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`;
                await financeService.saveExchangeRate(dateStr, {
                    purchase: item.purchase,
                    sale: item.sale
                });
            }
            showNotification(`Se guardaron ${parsedData.length} registros correctamente`, "success");
            setShowPasteModal(false);
            setSunatText('');
            setParsedData([]);
            fetchRates();
        } catch (error) {
            showNotification("Error parcial al guardar el lote", "error");
        } finally {
            setIsSavingBatch(false);
        }
    };

    // Renderizado de Celdas
    const renderCalendarCells = () => {
        const cells = [];
        // Empty cells for padding
        for (let i = 0; i < firstDay; i++) {
            cells.push(<div key={`empty-${i}`} style={{ background: '#0f172a', border: '1px solid #1e293b', minHeight: '100px' }} />);
        }

        // Day cells
        for (let day = 1; day <= daysInMonth; day++) {
            const rate = getRateForDay(day);
            const isToday = new Date().toDateString() === new Date(currentYear, currentMonth, day).toDateString();
            
            // Check if it's in parsed data (preview mode)
            const preview = parsedData.find(p => p.day === day);
            const activeRate = preview || rate;

            cells.push(
                <div key={day} style={{ 
                    background: isToday ? '#1e293b' : '#0f172a', 
                    border: isToday ? '1px solid #3b82f6' : '1px solid #1e293b', 
                    minHeight: '100px',
                    padding: '0.5rem',
                    position: 'relative'
                }}>
                    <span style={{ 
                        color: activeRate ? 'white' : '#475569', 
                        fontWeight: 'bold', 
                        fontSize: '0.9rem',
                        opacity: activeRate ? 1 : 0.5
                    }}>{day}</span>
                    
                    {activeRate && (
                        <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <div style={{ 
                                background: '#dcfce7', color: '#166534', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px',
                                display: 'flex', justifyContent: 'space-between', border: '1px solid #bef264'
                            }}>
                                <span>Compra</span>
                                <strong>{activeRate.purchase.toFixed(3)}</strong>
                            </div>
                            <div style={{ 
                                background: '#e0f2fe', color: '#075985', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px',
                                display: 'flex', justifyContent: 'space-between', border: '1px solid #7dd3fc'
                            }}>
                                <span>Venta</span>
                                <strong>{activeRate.sale.toFixed(3)}</strong>
                            </div>
                            {preview && <div style={{ fontSize: '0.5rem', color: '#fbbf24', textAlign: 'center', marginTop: '2px' }}>PENDIENTE</div>}
                        </div>
                    )}
                </div>
            );
        }
        return cells;
    };

    return (
        <Layout>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
                {/* Header Estilo SUNAT */}
                <div style={{ 
                    background: '#3b82f6', color: 'white', padding: '1rem 1.5rem', borderRadius: '0.75rem 0.75rem 0 0',
                    display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid #2563eb'
                }}>
                    <CalendarIcon size={20} />
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Consulta de tipo de cambio oficial</h2>
                </div>

                <div style={{ 
                    background: '#1e293b', border: '1px solid #334155', borderTop: 'none', padding: '1.5rem', borderRadius: '0 0 0.75rem 0.75rem',
                    marginBottom: '2rem'
                }}>
                    {/* Toolbar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Button variant="secondary" onClick={() => setShowPasteModal(true)} style={{ gap: '0.5rem' }}>
                                <ClipboardList size={18} /> Importar desde SUNAT
                            </Button>
                            <Button variant="outline" style={{ gap: '0.5rem' }}>
                                <Download size={18} /> Descargar Excel
                            </Button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: '#0f172a', padding: '0.5rem 1rem', borderRadius: '0.75rem', border: '1px solid #334155' }}>
                            <button onClick={() => handleMonthChange(-1)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer' }}><ChevronLeft /></button>
                            <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem', minWidth: '150px', textAlign: 'center' }}>
                                {monthNames[currentMonth]} {currentYear}
                            </div>
                            <button onClick={() => handleMonthChange(1)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer' }}><ChevronRight /></button>
                        </div>

                        <button onClick={() => setViewDate(new Date())} style={{ background: '#334155', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
                            Mes Actual
                        </button>
                    </div>

                    {/* CALENDARIO GRID */}
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(7, 1fr)', 
                        background: '#334155', 
                        gap: '1px', 
                        borderRadius: '0.5rem',
                        overflow: 'hidden',
                        border: '1px solid #334155'
                    }}>
                        {/* Headers */}
                        {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(d => (
                            <div key={d} style={{ background: '#0f172a', padding: '0.75rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center' }}>
                                {d}
                            </div>
                        ))}
                        
                        {renderCalendarCells()}
                    </div>

                    {/* Notas Legales / Informativas */}
                    <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#0f172a', borderRadius: '1rem', border: '1px solid #1e293b' }}>
                        <h4 style={{ color: '#3b82f6', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Info size={16} /> Notas Informativas
                        </h4>
                        <ul style={{ color: '#64748b', fontSize: '0.85rem', margin: 0, paddingLeft: '1.2rem', lineHeight: '1.6' }}>
                            <li>El tipo de cambio publicado corresponde a la cotización de cierre de la SBS del día anterior.</li>
                            <li>En los días que no se cuente con tipo de cambio publicado, se deberá tomar el del día inmediato anterior.</li>
                            <li>Los datos importados desde el asistente de SUNAT deben ser validados visualmente antes de impactar en los libros contables.</li>
                        </ul>
                    </div>
                </div>

                {/* MODAL DE IMPORTACIÓN MASIVA */}
                {showPasteModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                        <div style={{ background: '#1e293b', width: '90%', maxWidth: '700px', borderRadius: '1.5rem', overflow: 'hidden', border: '1px solid #334155' }}>
                            <div style={{ background: '#3b82f6', color: 'white', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0 }}>Importar desde Calendario SUNAT</h3>
                                <button onClick={() => setShowPasteModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
                            </div>
                            
                            <div style={{ padding: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '0.75rem' }}>
                                    <AlertTriangle size={24} />
                                    <p style={{ margin: 0, fontSize: '0.9rem' }}>
                                        Copie toda la tabla de SUNAT y péguela aquí. El sistema procesará los datos para <strong>{monthNames[currentMonth]} {currentYear}</strong>.
                                    </p>
                                </div>

                                <textarea 
                                    placeholder="Pegue el texto aquí (ej: 1 Compra 3.358 Venta 3.368 ...)"
                                    value={sunatText}
                                    onChange={(e) => setSunatText(e.target.value)}
                                    style={{ 
                                        width: '100%', height: '200px', background: '#0f172a', border: '1px solid #334155', borderRadius: '1rem',
                                        padding: '1rem', color: 'white', fontFamily: 'monospace', resize: 'none', marginBottom: '1.5rem'
                                    }}
                                />

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <Button 
                                        variant="secondary" 
                                        style={{ flex: 1 }} 
                                        onClick={processSunatPaste}
                                        disabled={!sunatText}
                                    >
                                        Analizar Texto
                                    </Button>
                                    
                                    {parsedData.length > 0 && (
                                        <Button 
                                            variant="primary" 
                                            style={{ flex: 1, background: '#10b981' }} 
                                            onClick={saveParsedBatch}
                                            disabled={isSavingBatch}
                                        >
                                            <Save size={18} style={{ marginRight: '0.5rem' }} />
                                            {isSavingBatch ? 'Guardando...' : `Confirmar y Guardar ${parsedData.length} días`}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default ExchangeRates;
