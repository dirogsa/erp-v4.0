import React from 'react';

const Table = ({
    columns = [],
    data = [],
    onRowClick,
    emptyMessage = 'No hay datos para mostrar',
    loading = false
}) => {
    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                Cargando...
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                {emptyMessage}
            </div>
        );
    }

    return (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr>
                    {columns.map((col, index) => (
                        <th
                            key={index}
                            style={{
                                textAlign: col.align || 'left',
                                padding: '0.75rem',
                                borderBottom: '2px solid #334155',
                                color: '#e2e8f0',
                                fontWeight: '600',
                                fontSize: '0.875rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}
                        >
                            {col.label}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.map((row, rowIndex) => (
                    <tr
                        key={rowIndex}
                        onClick={() => onRowClick?.(row)}
                        style={{
                            cursor: onRowClick ? 'pointer' : 'default',
                            transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            if (onRowClick) {
                                e.currentTarget.style.backgroundColor = '#1e293b';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        {columns.map((col, colIndex) => (
                            <td
                                key={colIndex}
                                style={{
                                    textAlign: col.align || 'left',
                                    padding: '0.75rem',
                                    borderBottom: '1px solid #334155',
                                    color: '#cbd5e1',
                                    fontSize: '0.875rem',
                                }}
                            >
                                {col.render ? col.render(row[col.key], row, rowIndex) : row[col.key]}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default Table;
