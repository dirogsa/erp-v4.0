import React from 'react';

const CrudPageTemplate = ({
    title,
    subtitle,
    headerActions,
    tabs,
    activeTab,
    onTabChange,
    children
}) => {
    return (
        <div style={{ padding: '2rem' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ color: 'white', marginBottom: '0.5rem' }}>{title}</h1>
                    <p style={{ color: '#94a3b8' }}>{subtitle}</p>
                </div>
                {headerActions && (
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {headerActions}
                    </div>
                )}
            </div>

            {/* Tabs Section */}
            {tabs && tabs.length > 0 && (
                <div style={{ 
                    marginBottom: '1.75rem', 
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    gap: '0.5rem',
                    overflowX: 'auto',
                    whiteSpace: 'nowrap',
                    paddingBottom: '2px'
                }}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => onTabChange(tab.key)}
                            style={{
                                padding: '0.85rem 1.5rem',
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === tab.key ? `2px solid ${tab.color || '#3b82f6'}` : '2px solid transparent',
                                color: activeTab === tab.key ? (tab.color || '#3b82f6') : '#94a3b8',
                                cursor: 'pointer',
                                fontWeight: activeTab === tab.key ? '700' : '500',
                                fontSize: '0.9rem',
                                transition: 'all 0.2s ease',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {tab.icon && <span>{tab.icon}</span>}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Content Section (Toolbar + Table) */}
            <div>
                {children}
            </div>
        </div>
    );
};

export default CrudPageTemplate;
