import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { 
  TrendingUp, 
  AlertTriangle, 
  ShoppingBag, 
  DollarSign, 
  Search, 
  Filter,
  Download,
  BrainCircuit,
  Package,
  ChevronRight,
  Settings,
  RefreshCw,
  Clock,
  Play,
  X,
  Zap,
  Activity,
  Box
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useNotification } from '../hooks/useNotification';

const ImportPlanning = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterBrand, setFilterBrand] = useState('ALL');
  const [budgetLimit, setBudgetLimit] = useState(60000); 
  const [selectedItems, setSelectedItems] = useState([]);
  const [groupBy, setGroupBy] = useState('none');
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Parametros en "Borrador" (Draft)
  const [leadTime, setLeadTime] = useState(60);
  const [supplyDays, setSupplyDays] = useState(90); // Ventana de Abastecimiento por defecto 3 meses
  const [serviceLevel, setServiceLevel] = useState(0.95);
  const [analysisDays, setAnalysisDays] = useState(180);
  const [recentDays, setRecentDays] = useState(30);
  const [showSettings, setShowSettings] = useState(true); // Iniciamos abierto para que el usuario configure primero

  // Estado que realmente dispara la consulta (Manual Trigger Gate)
  const [appliedParams, setAppliedParams] = useState(null);
  const hasExecuted = React.useRef(false); // Barrera contra HMR y StrictMode

  const { showNotification } = useNotification();

  const { data: planningData, isLoading, isError, isFetching } = useQuery({
    queryKey: ['import-planning', appliedParams],
    queryFn: async () => {
      // Doble barrera: el estado Y la referencia deben confirmar la ejecución
      if (!appliedParams || !hasExecuted.current) return null;
      const response = await api.get('/intelligence/import-planning', {
        params: appliedParams
      });
      return response.data;
    },
    enabled: !!appliedParams && hasExecuted.current,
    staleTime: 1000 * 60 * 5, // Cache 5 minutos (optimización Free Tier)
    gcTime: 1000 * 60 * 10,   // Mantener en memoria 10 minutos
  });

  const handleExecuteEngine = () => {
    hasExecuted.current = true; // Activar la barrera explícitamente
    setAppliedParams({
      lead_time_days: leadTime,
      supply_days: supplyDays,
      service_level: serviceLevel,
      analysis_days: analysisDays,
      recent_days: recentDays
    });
    showNotification('Motor predictivo en marcha...', 'info');
  };

  const toggleSelection = (sku) => {
    setSelectedItems(prev => 
      prev.includes(sku) ? prev.filter(i => i !== sku) : [...prev, sku]
    );
  };

  // Lógica de simulación de presupuesto
  let runningBudget = 0;
  const processedData = planningData?.map(item => {
    const cost = item.estimated_investment;
    const canFit = (runningBudget + cost) <= budgetLimit;
    if (canFit) runningBudget += cost;
    return { ...item, inBudget: canFit };
  });

  const filteredData = processedData?.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = item.name?.toLowerCase().includes(searchLower) || false;
    const skuMatch = item.sku?.toLowerCase().includes(searchLower) || false;
    const brandMatch = item.brand?.toLowerCase().includes(searchLower) || false;
    const matchesPriority = filterPriority === 'ALL' || item.priority === filterPriority;
    const matchesBrand = filterBrand === 'ALL' || item.brand === filterBrand;
    return (nameMatch || skuMatch || brandMatch) && matchesPriority && matchesBrand;
  });

  const availableBrands = Array.from(new Set(planningData?.map(i => i.brand) || [])).filter(Boolean).sort();

  const groupedData = groupBy !== 'none' ? 
    filteredData?.reduce((acc, item) => {
      let key = 'SIN ESPECIFICAR';
      if (groupBy === 'brand') key = item.brand || 'SIN MARCA';
      if (groupBy === 'category') key = item.category_name || 'SIN CATEGORÍA';
      if (groupBy === 'priority') key = `CLASE ${item.priority}`;
      
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {}) : null;

  return (
    <div className="import-planning-view">
      <style>{`
        .import-planning-view {
          color: var(--text-color);
          padding-bottom: 100px;
        }
        
        .planning-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2.5rem;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .header-title-box {
          display: flex;
          align-items: center;
          gap: 1.2rem;
        }

        .icon-container {
          background: var(--primary-color);
          padding: 1rem;
          border-radius: 1.2rem;
          box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
          display: flex;
        }

        .title-text h1 {
          margin: 0;
          font-size: 2.2rem;
          font-weight: 900;
          letter-spacing: -1px;
        }

        .version-tag {
          font-size: 0.75rem;
          background: rgba(59, 130, 246, 0.15);
          color: var(--primary-color);
          padding: 0.2rem 0.6rem;
          border-radius: 0.5rem;
          margin-left: 0.8rem;
          vertical-align: middle;
        }

        .budget-card {
          background: var(--surface-color);
          border: 1px solid var(--border-color);
          padding: 1rem 1.5rem;
          border-radius: 1.5rem;
          display: flex;
          gap: 1.5rem;
          align-items: center;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        .budget-input-group label {
          display: block;
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--primary-color);
          margin-bottom: 0.3rem;
        }

        .budget-input-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .currency-symbol { color: var(--text-secondary); font-weight: bold; }

        .clean-input {
          background: transparent;
          border: none;
          border-bottom: 2px solid var(--border-color);
          color: var(--text-color);
          font-size: 1.3rem;
          font-weight: 900;
          width: 120px;
          outline: none;
          transition: border-color 0.3s;
        }

        .clean-input:focus { border-color: var(--primary-color); }

        .settings-panel {
          background: var(--surface-color);
          border: 2px solid rgba(59, 130, 246, 0.1);
          border-radius: 2rem;
          padding: 2rem;
          margin-bottom: 2rem;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2.5rem;
          animation: slideDown 0.4s ease-out;
          position: relative;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .setting-item label {
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--text-secondary);
          text-transform: uppercase;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .range-slider {
          width: 100%;
          height: 6px;
          background: var(--border-color);
          border-radius: 10px;
          appearance: none;
          accent-color: var(--primary-color);
        }

        .execute-action-box {
          grid-column: 1 / -1;
          display: flex;
          justify-content: center;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }

        .btn-execute {
          background: #10b981;
          color: white;
          border: none;
          padding: 1rem 3rem;
          border-radius: 1.2rem;
          font-weight: 900;
          font-size: 1.1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .btn-execute:hover {
          transform: scale(1.05) translateY(-5px);
          box-shadow: 0 15px 30px rgba(16, 185, 129, 0.4);
          background: #059669;
        }

        .btn-execute:disabled {
          background: var(--border-color);
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .control-bar {
          display: flex;
          gap: 1.2rem;
          margin-bottom: 2rem;
          align-items: center;
        }

        .search-wrapper {
          position: relative;
          flex: 1;
        }

        .search-icon {
          position: absolute;
          left: 1.2rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary);
        }

        .styled-input {
          width: 100%;
          padding: 1rem 1rem 1rem 3.5rem;
          background: var(--surface-color);
          border: 1px solid var(--border-color);
          border-radius: 1.2rem;
          color: var(--text-color);
          font-weight: 600;
          outline: none;
          transition: all 0.3s;
        }

        .styled-input:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .styled-select {
          background: var(--surface-color);
          border: 1px solid var(--border-color);
          color: var(--text-color);
          padding: 0.8rem 1.5rem;
          border-radius: 1.2rem;
          font-weight: 800;
          cursor: pointer;
        }

        .btn-toggle {
          background: var(--surface-color);
          border: 1px solid var(--border-color);
          color: var(--text-color);
          padding: 0.8rem 1.5rem;
          border-radius: 1.2rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-toggle.active {
          background: var(--primary-color);
          border-color: var(--primary-color);
        }

        .empty-state-container {
          height: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--surface-color);
          border-radius: 2rem;
          border: 2px dashed var(--border-color);
          color: var(--text-secondary);
          text-align: center;
          padding: 2rem;
        }

        .planning-table-container {
          background: var(--surface-color);
          border-radius: 2rem;
          border: 1px solid var(--border-color);
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }

        .planning-table {
          width: 100%;
          border-collapse: collapse;
        }

        .planning-table th {
          background: rgba(255,255,255,0.03);
          padding: 1.5rem;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text-secondary);
          border-bottom: 1px solid var(--border-color);
        }

        .planning-table td {
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }

        .row-dimmed { opacity: 0.4; filter: grayscale(1); }
        .row-selected { background: rgba(59, 130, 246, 0.05); }

        .sku-box { display: flex; flex-direction: column; }
        .sku-main { font-size: 1.2rem; font-weight: 900; }
        .brand-sub { font-size: 0.7rem; color: var(--primary-color); font-weight: 800; text-transform: uppercase; }

        .trend-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          font-weight: 900;
        }
        .trend-up { color: #10b981; }
        .trend-down { color: #f43f5e; }

        .suggested-qty {
          font-size: 1.8rem;
          font-weight: 900;
          color: var(--primary-color);
        }

        .brand-header {
          background: rgba(255,255,255,0.05);
          padding: 1rem 1.5rem;
          font-weight: 900;
          text-transform: uppercase;
          font-size: 0.8rem;
          display: flex;
          justify-content: space-between;
        }

        .floating-action-bar {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          background: #0f172a;
          border: 1px solid var(--primary-color);
          padding: 1.2rem 2.5rem;
          border-radius: 2rem;
          display: flex;
          align-items: center;
          gap: 2.5rem;
          box-shadow: 0 20px 50px rgba(0,0,0,0.6);
          z-index: 1000;
          animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes slideUp { from { transform: translate(-50%, 50px); opacity: 0; } }

        .btn-primary {
          background: var(--primary-color);
          border: none;
          color: white;
          padding: 1rem 2rem;
          border-radius: 1.2rem;
          font-weight: 900;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.8rem;
          transition: transform 0.2s;
        }
        .btn-primary:hover { transform: scale(1.05); }

        .planning-loader {
          height: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: var(--text-secondary);
          background: var(--surface-color);
          border-radius: 2rem;
        }
        .spin-icon { animation: spin 4s linear infinite; color: var(--primary-color); margin-bottom: 2rem; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* Detail Panel Styles */
        .detail-panel-overlay {
          position: fixed;
          top: 0;
          right: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(8px);
          z-index: 2000;
          display: flex;
          justify-content: flex-end;
          animation: fadeIn 0.3s ease;
        }

        .detail-panel-content {
          width: 500px;
          height: 100%;
          background: #0f172a;
          border-left: 1px solid var(--primary-color);
          box-shadow: -20px 0 50px rgba(0,0,0,0.8);
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          animation: slideFromRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          overflow-y: auto;
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideFromRight { from { transform: translateX(100%); } to { transform: translateX(0); } }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .panel-sku-title { font-size: 2rem; font-weight: 900; line-height: 1; letter-spacing: -1px; }
        .panel-brand-tag { 
          display: inline-block; 
          background: var(--primary-color); 
          color: white; 
          padding: 0.2rem 0.6rem; 
          border-radius: 0.4rem; 
          font-size: 0.6rem; 
          font-weight: 900; 
          text-transform: uppercase;
          margin-top: 0.5rem;
        }

        .metric-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.2rem;
        }

        .metric-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          padding: 1.2rem;
          border-radius: 1.2rem;
        }

        .metric-label { font-size: 0.6rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.4rem; }
        .metric-value { font-size: 1.4rem; font-weight: 900; }
        .metric-unit { font-size: 0.7rem; opacity: 0.5; margin-left: 0.3rem; }

        .explanation-box {
          background: rgba(59, 130, 246, 0.05);
          border-left: 4px solid var(--primary-color);
          padding: 1.5rem;
          border-radius: 0.8rem;
        }

        .formula-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
          background: rgba(0,0,0,0.3);
          padding: 1rem;
          border-radius: 0.5rem;
          margin-top: 1rem;
          color: #94a3b8;
        }

        .chart-container {
          height: 180px;
          margin: 1rem 0;
        }

        .close-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .close-circle:hover { background: #f43f5e; color: white; transform: rotate(90deg); }

        .clickable-row { cursor: pointer; transition: background 0.2s; }
        .clickable-row:hover { background: rgba(255,255,255,0.02) !important; }
      `}</style>

      {/* Header Section */}
      <div className="planning-header">
        <div className="header-title-box">
          <div className="icon-container">
            <BrainCircuit size={32} color="white" />
          </div>
          <div className="title-text">
            <h1>Inteligencia de Importación <span className="version-tag">V4.3</span></h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontWeight: 600 }}>Planificación Estratégica Industrial</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={() => setShowSettings(!showSettings)} className="btn-toggle">
            <Settings size={18} /> Configurar Parámetros
          </button>
          
          <div className="budget-card">
            <div className="budget-input-group">
              <label>Presupuesto Simulado</label>
              <div className="budget-input-wrapper">
                <span className="currency-symbol">S/</span>
                <input 
                  type="number" className="clean-input"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(Number(e.target.value))}
                />
              </div>
            </div>
            <div style={{ height: '30px', width: '1px', background: 'var(--border-color)' }}></div>
            <div className="budget-input-group" style={{ minWidth: '150px' }}>
              <label>Capacidad Uso</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ 
                    width: `${Math.min(100, (runningBudget / budgetLimit) * 100)}%`, 
                    height: '100%', 
                    background: (runningBudget > budgetLimit) ? '#f43f5e' : '#10b981',
                    boxShadow: (runningBudget > budgetLimit) ? '0 0 10px rgba(244, 63, 94, 0.5)' : '0 0 10px rgba(16, 185, 129, 0.5)',
                    transition: 'width 0.5s ease-out'
                  }}></div>
                </div>
                <div style={{ fontSize: '1.1rem', fontVariantNumeric: 'tabular-nums', fontWeight: 900, color: (runningBudget > budgetLimit) ? '#f43f5e' : '#10b981' }}>
                  {((runningBudget / budgetLimit) * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel (ALWAYS VISIBLE INITIALLY OR COLLAPSIBLE) */}
      {showSettings && (
        <div className="settings-panel">
          <div className="setting-item">
            <label><RefreshCw size={14} /> Lead Time (Días)</label>
            <input type="range" min="1" max="150" value={leadTime} onChange={e => setLeadTime(Number(e.target.value))} className="range-slider" />
            <div style={{ textAlign: 'right', fontWeight: 900, marginTop: '0.5rem' }}>{leadTime} días</div>
          </div>
          <div className="setting-item">
            <label><Clock size={14} /> Ventana Tendencia</label>
            <input type="range" min="7" max="90" value={recentDays} onChange={e => setRecentDays(Number(e.target.value))} className="range-slider" style={{ accentColor: '#f59e0b' }} />
            <div style={{ textAlign: 'right', fontWeight: 900, marginTop: '0.5rem', color: '#f59e0b' }}>{recentDays} días</div>
          </div>
          <div className="setting-item">
            <label><ShoppingBag size={14} /> Ventana de Abastecimiento (Días)</label>
            <input type="range" min="0" max="365" value={supplyDays} onChange={e => setSupplyDays(Number(e.target.value))} className="range-slider" style={{ accentColor: '#10b981' }} />
            <div style={{ textAlign: 'right', fontWeight: 900, marginTop: '0.5rem', color: '#10b981' }}>{supplyDays} días</div>
          </div>
          <div className="setting-item">
            <label><TrendingUp size={14} /> Confianza</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[0.90, 0.95, 0.99].map(lvl => (
                <button key={lvl} onClick={() => setServiceLevel(lvl)} className={`btn-toggle ${serviceLevel === lvl ? 'active' : ''}`} style={{ flex: 1, fontSize: '0.7rem' }}>
                  {lvl * 100}%
                </button>
              ))}
            </div>
          </div>
          <div className="setting-item">
            <label><Search size={14} /> Historial</label>
            <select value={analysisDays} onChange={e => setAnalysisDays(Number(e.target.value))} className="styled-select" style={{ width: '100%' }}>
              <option value={90}>3 Meses</option>
              <option value={180}>6 Meses</option>
              <option value={365}>1 Año</option>
            </select>
          </div>

          <div className="execute-action-box">
            <button 
              className="btn-execute" 
              onClick={handleExecuteEngine}
              disabled={isFetching}
            >
              {isFetching ? (
                <>
                  <RefreshCw className="spin-icon" style={{ margin: 0, width: '20px', height: '20px' }} />
                  Procesando Inteligencia...
                </>
              ) : (
                <>
                  <Play size={20} fill="currentColor" />
                  EJECUTAR MOTOR PREDICTIVO
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Controls (Only if data exists) */}
      {planningData && (
        <div className="control-bar">
          <div className="search-wrapper">
            <Search className="search-icon" size={20} />
            <input 
              type="text" placeholder="Filtrar resultados por SKU, Marca o Nombre..." 
              className="styled-input" value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)' }}>MARCA:</span>
            <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)} className="styled-select">
              <option value="ALL">Todas las Marcas</option>
              {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)' }}>AGRUPAR:</span>
            <select value={groupBy} onChange={e => setGroupBy(e.target.value)} className="styled-select">
              <option value="none">Sin Agrupar</option>
              <option value="brand">Marca</option>
              <option value="category">Categoría</option>
              <option value="priority">Segmentación</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)' }}>SEGMENTACIÓN:</span>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="styled-select">
              <option value="ALL">Todos los Niveles (ABC)</option>
              <option value="A">Clase A - Alta Rotación</option>
              <option value="B">Clase B - Rotación Media</option>
              <option value="C">Clase C - Baja Rotación</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {isFetching ? (
        <div className="planning-loader">
          <BrainCircuit className="spin-icon" size={64} />
          <h2>Analizando Matrices Dirogsa...</h2>
          <p>Consolidando demanda histórica bajo demanda.</p>
        </div>
      ) : !planningData ? (
        <div className="empty-state-container">
          <BrainCircuit size={80} style={{ opacity: 0.2, marginBottom: '2rem' }} />
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>Motor Predictivo en Reposo</h2>
          <p style={{ maxWidth: '400px', margin: '1rem 0 2rem 0', opacity: 0.7 }}>
            Ajusta los parámetros de Lead Time y Nivel de Servicio arriba, luego presiona el botón verde para iniciar el cálculo.
          </p>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary-color)' }}>OPTIMIZACIÓN DE RECURSOS ACTIVA (TIER FREE)</div>
        </div>
      ) : (
        <div className="planning-table-container">
          <table className="planning-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input type="checkbox" onChange={e => {
                    if (e.target.checked) setSelectedItems(filteredData.map(i => i.sku));
                    else setSelectedItems([]);
                  }} />
                </th>
                <th>Producto</th>
                <th style={{ textAlign: 'center' }}>Tendencia</th>
                <th style={{ textAlign: 'center' }}>Stock / BO</th>
                <th style={{ textAlign: 'center' }}>Velocidad</th>
                <th style={{ textAlign: 'center' }}>Sugerido</th>
                <th style={{ textAlign: 'center' }}>Inversión</th>
              </tr>
            </thead>
            <tbody>
              {groupBy !== 'none' ? (
                Object.entries(groupedData || {}).map(([groupKey, items]) => (
                  <React.Fragment key={groupKey}>
                    <tr>
                      <td colSpan={7} className="brand-header">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Package size={14} /> {groupKey} 
                          <span style={{ opacity: 0.4, fontSize: '0.6rem' }}>({items.length} items)</span>
                        </span>
                        <span>SUBTOTAL: S/ {items.reduce((a, b) => a + b.estimated_investment, 0).toLocaleString()}</span>
                      </td>
                    </tr>
                    {items.map(item => (
                      <PlanningRow 
                        key={item.sku} item={item} 
                        isSelected={selectedItems.includes(item.sku)}
                        onToggle={(e) => { e.stopPropagation(); toggleSelection(item.sku); }}
                        onClick={() => setSelectedItem(item)}
                      />
                    ))}
                  </React.Fragment>
                ))
              ) : (
                filteredData?.map(item => (
                  <PlanningRow 
                    key={item.sku} item={item} 
                    isSelected={selectedItems.includes(item.sku)}
                    onToggle={(e) => { e.stopPropagation(); toggleSelection(item.sku); }}
                    onClick={() => setSelectedItem(item)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Panel */}
      <DetailPanel 
        item={selectedItem} 
        onClose={() => setSelectedItem(null)} 
        leadTime={leadTime}
        supplyDays={supplyDays}
      />

      {/* Floating Bar */}
      {selectedItems.length > 0 && (
        <div className="floating-action-bar">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)' }}>SELECCIONADOS</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 900 }}>{selectedItems.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)' }}>TOTAL PEDIDO</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary-color)' }}>
              S/ {filteredData.filter(i => selectedItems.includes(i.sku)).reduce((a, b) => a + b.estimated_investment, 0).toLocaleString()}
            </span>
          </div>
          <button className="btn-primary" onClick={() => showNotification(`Generando pedido para ${selectedItems.length} ítems...`, 'success')}>
            <ShoppingBag size={20} /> Generar Orden
          </button>
          <button onClick={() => setSelectedItems([])} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 800 }}>CANCELAR</button>
        </div>
      )}
    </div>
  );
};

const PlanningRow = ({ item, isSelected, onToggle, onClick }) => (
  <tr 
    className={`${!item.inBudget ? 'row-dimmed' : ''} ${isSelected ? 'row-selected' : ''} clickable-row`}
    onClick={onClick}
  >
    <td>
      <input type="checkbox" checked={isSelected} onChange={onToggle} />
    </td>
    <td>
      <div className="sku-box">
        <span className="sku-main">{item.sku}</span>
        <span className="brand-sub">{item.brand}</span>
        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{item.name}</span>
      </div>
    </td>
    <td>
      <TrendIndicator label={item.trend} factor={item.trend_factor} />
    </td>
    <td style={{ textAlign: 'center' }}>
      <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{item.stock_current}</div>
      {item.backorder_qty > 0 && <div style={{ color: '#f43f5e', fontSize: '0.6rem', fontWeight: 900 }}>BO: {item.backorder_qty}</div>}
    </td>
    <td style={{ textAlign: 'center' }}>
      <div style={{ fontWeight: 800 }}>{item.vos_projected}</div>
      <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>unid/día</div>
    </td>
    <td style={{ textAlign: 'center' }}>
      <div className="suggested-qty">{item.suggested_qty}</div>
    </td>
    <td style={{ textAlign: 'center' }}>
      <div style={{ fontWeight: 900 }}>S/ {item.estimated_investment.toLocaleString()}</div>
      <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>Unit: {item.unit_cost}</div>
    </td>
  </tr>
);

const TrendIndicator = ({ label, factor }) => {
  const isUp = label === 'GROWING';
  const isDown = label === 'DECLINING';
  return (
    <div className={`trend-badge ${isUp ? 'trend-up' : isDown ? 'trend-down' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        {isUp && <TrendingUp size={14} />}
        {isDown && <TrendingUp size={14} style={{ transform: 'rotate(180deg)' }} />}
        <span>x{factor}</span>
      </div>
      <span style={{ fontSize: '0.5rem', textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
};

const DetailPanel = ({ item, onClose, leadTime, supplyDays }) => {
  if (!item) return null;

  const chartData = item.monthly_series?.map((qty, index) => ({
    month: `M-${item.monthly_series.length - index}`,
    ventas: qty
  })) || [];

  return (
    <div className="detail-panel-overlay" onClick={onClose}>
      <div className="detail-panel-content" onClick={e => e.stopPropagation()}>
        <div className="panel-header">
          <div>
            <div className="panel-sku-title">{item.sku}</div>
            <div className="panel-brand-tag">{item.brand}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.8rem', fontWeight: 600 }}>
              {item.name}
            </div>
            <div style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: '0.2rem', textTransform: 'uppercase', fontWeight: 800 }}>
              {item.category_name}
            </div>
          </div>
          <div className="close-circle" onClick={onClose}>
            <X size={20} />
          </div>
        </div>

        <div className="metric-grid">
          <div className="metric-card">
            <div className="metric-label">Velocidad Proyectada</div>
            <div className="metric-value" style={{ color: 'var(--primary-color)' }}>
              {item.vos_projected} <span className="metric-unit">unid/día</span>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Tendencia Reciente</div>
            <div className="metric-value" style={{ color: item.trend === 'GROWING' ? '#10b981' : item.trend === 'DECLINING' ? '#f43f5e' : 'white' }}>
              x{item.trend_factor} <span className="metric-unit">{item.trend}</span>
            </div>
          </div>
        </div>

        <div className="explanation-box">
          <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={16} /> Diagnóstico Predictivo
          </h4>
          <p style={{ fontSize: '0.8rem', opacity: 0.8, margin: 0, lineHeight: 1.5 }}>
            Este ítem muestra una demanda {item.trend === 'GROWING' ? 'en crecimiento' : item.trend === 'DECLINING' ? 'en declive' : 'estable'}. 
            Para cubrir {leadTime} días de espera y {supplyDays} días de abastecimiento con un {((item.safety_stock / item.target_stock) * 100).toFixed(0)}% de seguridad, 
            el stock objetivo se establece en {item.target_stock} unidades.
          </p>
          <div className="formula-text">
            Sugerido = (Velocidad: {item.vos_projected} * Horizonte: {leadTime + supplyDays}) + Safety: {item.safety_stock} + Backorders: {item.backorder_qty} - Stock: {item.stock_current}
          </div>
        </div>

        <div>
          <div className="metric-label" style={{ marginBottom: '1rem' }}>Historial de Ventas (Últimos Meses)</div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--primary-color)', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="ventas" stroke="var(--primary-color)" fillOpacity={1} fill="url(#colorVentas)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="metric-grid">
          <div className="metric-card" style={{ background: 'rgba(244, 63, 94, 0.05)' }}>
            <div className="metric-label">Riesgo Stockout</div>
            <div className="metric-value" style={{ color: item.stockout_risk === 'CRITICAL' ? '#f43f5e' : '#f59e0b', fontSize: '1rem' }}>
              NIVEL {item.stockout_risk}
            </div>
          </div>
          <div className="metric-card" style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
            <div className="metric-label">Inversión Estimada</div>
            <div className="metric-value" style={{ fontSize: '1.1rem' }}>
              S/ {item.estimated_investment.toLocaleString()}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem' }}>
           <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>
             <Zap size={18} /> ACEPTAR SUGERENCIA
           </button>
        </div>
      </div>
    </div>
  );
};

export default ImportPlanning;
