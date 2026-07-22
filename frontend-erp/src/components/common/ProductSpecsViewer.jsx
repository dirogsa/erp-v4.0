import React from 'react';

const ProductSpecsViewer = ({ specs = [], variant = 'list' }) => {
    if (!specs || specs.length === 0) {
        return (
            <p style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.85rem' }}>
                No hay especificaciones registradas.
            </p>
        );
    }

    if (variant === 'table') {
        return (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                    {specs.map((spec, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                            <td style={{ padding: '12px 0', color: '#94a3b8', width: '40%' }}>
                                {spec.display_label || spec.label}
                            </td>
                            <td style={{ padding: '12px 0', color: '#e2e8f0', fontWeight: '500' }}>
                                {spec.value}{' '}
                                {spec.measure_type && (
                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                        {spec.measure_type}
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }

    // Default variant: list (used in IndustrialIngestor and compact views)
    return (
        <div style={{ background: '#1e293b', borderRadius: '1rem', border: '1px solid #334155', overflow: 'hidden' }}>
            {specs.map((spec, i) => (
                <div 
                    key={i} 
                    style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        padding: '0.65rem 1rem', 
                        borderBottom: i < specs.length - 1 ? '1px solid #33415555' : 'none', 
                        fontSize: '0.85rem' 
                    }}
                >
                    <span style={{ color: '#94a3b8' }}>
                        {spec.display_label || spec.label}
                    </span>
                    <span style={{ color: 'white', fontWeight: '700', fontFamily: "'JetBrains Mono', monospace" }}>
                        {spec.value}{' '}
                        {spec.measure_type === 'mm' ? 'mm' : ''}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default ProductSpecsViewer;
