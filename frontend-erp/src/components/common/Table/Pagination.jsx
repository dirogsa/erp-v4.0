import React from 'react';
import Button from '../Button';

const Pagination = ({ current, total, onChange, pageSize, onPageSizeChange }) => {
    if (total <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (total <= maxVisible) {
            for (let i = 1; i <= total; i++) pages.push(i);
        } else {
            if (current <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(total);
            } else if (current >= total - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = total - 3; i <= total; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                pages.push(current - 1);
                pages.push(current);
                pages.push(current + 1);
                pages.push('...');
                pages.push(total);
            }
        }
        return pages;
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1rem',
            padding: '1rem',
            borderTop: '1px solid #334155'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                    Página {current} de {total}
                </span>
                {onPageSizeChange && (
                    <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        style={{
                            backgroundColor: '#1e293b',
                            color: '#e2e8f0',
                            border: '1px solid #334155',
                            borderRadius: '0.25rem',
                            padding: '0.25rem 0.5rem'
                        }}
                    >
                        <option value={10}>10 / pág</option>
                        <option value={20}>20 / pág</option>
                        <option value={50}>50 / pág</option>
                        <option value={100}>100 / pág</option>
                    </select>
                )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button
                    variant="secondary"
                    onClick={() => onChange(current - 1)}
                    disabled={current === 1}
                    style={{ padding: '0.25rem 0.75rem' }}
                >
                    Anterior
                </Button>

                {getPageNumbers().map((page, index) => (
                    <button
                        key={index}
                        onClick={() => typeof page === 'number' ? onChange(page) : null}
                        disabled={page === '...'}
                        style={{
                            backgroundColor: page === current ? '#3b82f6' : 'transparent',
                            color: page === current ? 'white' : '#94a3b8',
                            border: page === current ? 'none' : '1px solid #334155',
                            borderRadius: '0.25rem',
                            padding: '0.25rem 0.75rem',
                            cursor: page === '...' ? 'default' : 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {page}
                    </button>
                ))}

                <Button
                    variant="secondary"
                    onClick={() => onChange(current + 1)}
                    disabled={current === total}
                    style={{ padding: '0.25rem 0.75rem' }}
                >
                    Siguiente
                </Button>
            </div>
        </div>
    );
};

export default Pagination;
