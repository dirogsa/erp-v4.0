import React from 'react';

const Table = ({
    columns = [],
    data = [],
    onRowClick,
    emptyMessage = 'No hay datos para mostrar',
    loading = false,
    enableSelection = false,
    selectedKeys = [],
    onSelectionChange,
    keyField = 'id'
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

    const handleSelectAll = (e) => {
        if (!onSelectionChange) return;
        const pageIds = data.map(row => row[keyField] || row._id);
        if (e.target.checked) {
            // Add all items from current page to the selection (avoiding duplicates)
            const newSelection = [...new Set([...selectedKeys, ...pageIds])];
            onSelectionChange(newSelection);
        } else {
            // Remove only items from current page from the selection
            const newSelection = selectedKeys.filter(id => !pageIds.includes(id));
            onSelectionChange(newSelection);
        }
    };

    const handleSelectRow = (e, row) => {
        e.stopPropagation();
        if (!onSelectionChange) return;
        const key = row[keyField] || row._id;
        if (e.target.checked) {
            onSelectionChange([...selectedKeys, key]);
        } else {
            onSelectionChange(selectedKeys.filter(k => k !== key));
        }
    };

    return (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr>
                    {enableSelection && (
                        <th style={{ width: '40px', padding: '0.75rem', borderBottom: '2px solid #334155' }}>
                            <input 
                                type="checkbox" 
                                onChange={handleSelectAll}
                                ref={(el) => {
                                    if (el) {
                                        const allInPage = data.every(row => selectedKeys.includes(row[keyField] || row._id));
                                        const someInPage = data.some(row => selectedKeys.includes(row[keyField] || row._id));
                                        el.indeterminate = someInPage && !allInPage;
                                    }
                                }}
                                checked={data.length > 0 && data.every(row => selectedKeys.includes(row[keyField] || row._id))}
                                style={{ cursor: 'pointer' }}
                            />
                        </th>
                    )}
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
                {data.map((row, rowIndex) => {
                    const rowKey = row[keyField] || row._id;
                    const isSelected = selectedKeys.includes(rowKey);
                    
                    return (
                        <tr
                            key={rowIndex}
                            onClick={() => onRowClick?.(row)}
                            style={{
                                cursor: onRowClick ? 'pointer' : 'default',
                                transition: 'background-color 0.2s',
                                backgroundColor: isSelected ? '#3b82f615' : 'transparent'
                            }}
                            onMouseEnter={(e) => {
                                if (!isSelected) e.currentTarget.style.backgroundColor = '#1e293b';
                            }}
                            onMouseLeave={(e) => {
                                if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                        >
                            {enableSelection && (
                                <td style={{ padding: '0.75rem', borderBottom: '1px solid #334155' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={isSelected}
                                        onChange={(e) => handleSelectRow(e, row)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </td>
                            )}
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
                    );
                })}
            </tbody>
        </table>
    );
};

export default Table;
