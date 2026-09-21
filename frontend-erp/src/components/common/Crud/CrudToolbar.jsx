import React from 'react';
import Input from '../Input';

const CrudToolbar = ({
    selectedIds = [],
    onClearSelection,
    onSelectAllFiltered,
    totalItems = 0,
    bulkActions = [],
    searchValue = '',
    onSearchChange,
    searchPlaceholder = "🔍 Buscar...",
    activeFilterLabel = '',
    onClearFilters
}) => {
    const isSelected = selectedIds.length > 0;

    return (
        <div style={{ marginBottom: '1.25rem', minHeight: '3.25rem' }}>
            {isSelected ? (
                <div style={{
                    background: 'linear-gradient(90deg, rgba(30, 58, 138, 0.35) 0%, rgba(15, 23, 42, 0.9) 100%)',
                    border: '1px solid #3b82f6',
                    borderRadius: '0.75rem',
                    padding: '0.75rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    boxShadow: '0 4px 20px -2px rgba(59, 130, 246, 0.25)',
                    animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
                    
                    {/* Indicador de Selección y Limpiar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            background: '#1d4ed8',
                            color: 'white',
                            fontWeight: '700',
                            fontSize: '0.85rem',
                            padding: '0.35rem 0.85rem',
                            borderRadius: '9999px',
                            letterSpacing: '0.02em',
                            whiteSpace: 'nowrap'
                        }}>
                            {selectedIds.length} {selectedIds.length === 1 ? 'seleccionado' : 'seleccionados'}
                        </span>

                        <button 
                            onClick={onClearSelection}
                            style={{ 
                                background: 'transparent', 
                                border: '1px solid #475569', 
                                color: '#94a3b8', 
                                fontSize: '0.8rem', 
                                padding: '0.35rem 0.75rem',
                                borderRadius: '0.5rem',
                                cursor: 'pointer', 
                                transition: 'all 0.15s ease',
                                whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#f8fafc'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#475569'; e.currentTarget.style.color = '#94a3b8'; }}
                        >
                            Deseleccionar
                        </button>

                        {onSelectAllFiltered && selectedIds.length < totalItems && (
                            <button 
                                onClick={onSelectAllFiltered}
                                style={{ 
                                    background: 'rgba(59, 130, 246, 0.15)', 
                                    border: '1px solid rgba(59, 130, 246, 0.4)', 
                                    color: '#60a5fa', 
                                    fontSize: '0.8rem', 
                                    padding: '0.35rem 0.75rem',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer', 
                                    fontWeight: '600',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Seleccionar los {totalItems} resultados
                            </button>
                        )}
                    </div>

                    {/* Botonera de Acciones en Línea */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        {bulkActions.map((action, idx) => {
                            const isDanger = action.variant === 'danger';
                            const isWarning = action.variant === 'warning';
                            const isSuccess = action.variant === 'success';

                            const bg = isDanger ? '#dc2626' : isWarning ? '#d97706' : isSuccess ? '#059669' : '#334155';
                            const hoverBg = isDanger ? '#b91c1c' : isWarning ? '#b45309' : isSuccess ? '#047857' : '#475569';

                            return (
                                <button
                                    key={idx}
                                    onClick={() => action.onClick(selectedIds)}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.45rem',
                                        padding: '0.45rem 0.95rem',
                                        borderRadius: '0.5rem',
                                        background: bg,
                                        color: 'white',
                                        border: 'none',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.15s ease',
                                        boxShadow: isDanger ? '0 2px 8px rgba(220, 38, 38, 0.3)' : 'none',
                                        marginLeft: isDanger ? '0.5rem' : '0'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = hoverBg; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = bg; }}
                                >
                                    {action.icon && <span style={{ fontSize: '0.95rem', lineHeight: 1 }}>{action.icon}</span>}
                                    <span>{action.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchValue}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>
                    {activeFilterLabel && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', whiteSpace: 'nowrap' }}>
                            <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                                Filtro: <b style={{ color: '#e2e8f0' }}>{activeFilterLabel}</b>
                            </span>
                            {onClearFilters && (
                                <button 
                                    onClick={onClearFilters}
                                    style={{ 
                                        background: 'rgba(239, 68, 68, 0.15)', 
                                        color: '#f87171', 
                                        border: '1px solid rgba(239, 68, 68, 0.3)', 
                                        padding: '0.35rem 0.75rem', 
                                        borderRadius: '0.5rem', 
                                        cursor: 'pointer', 
                                        fontSize: '0.8rem',
                                        fontWeight: '600'
                                    }}
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CrudToolbar;
