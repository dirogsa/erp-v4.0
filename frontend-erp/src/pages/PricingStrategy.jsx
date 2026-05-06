import React, { useState } from 'react';
import PricingLists from './PricingLists';
import PricingBulk from './PricingBulk';
import PricingPolicies from './PricingPolicies';

const PricingStrategy = () => {
    // We make 'bulk' (The Master Console) the default tab as requested
    const [activeTab, setActiveTab] = useState('bulk'); 

    const tabs = [
        { id: 'bulk', label: '⚡ Consola Maestra', icon: '🚀' },
        { id: 'lists', label: '📋 Listas y Campañas', icon: '✨' },
        { id: 'policies', label: '🛡️ Reglas y Escudos', icon: '⚖️' }
    ];

    return (
        <div style={{ padding: '2rem', minHeight: '100vh', backgroundColor: '#0f172a' }}>
            {/* Header Estratégico */}
            <header style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                    Estrategia de Precios Maestra
                </h1>
                <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
                    Sincronización centralizada de márgenes y competitividad industrial.
                </p>
            </header>

            {/* Tabs de Navegación Premium */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '2.5rem',
                padding: '0.5rem',
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                borderRadius: '1rem',
                width: 'fit-content',
                border: '1px solid #334155'
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.75rem',
                            border: 'none',
                            backgroundColor: activeTab === tab.id ? '#3b82f6' : 'transparent',
                            color: activeTab === tab.id ? 'white' : '#94a3b8',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Contenido Dinámico */}
            <main style={{
                backgroundColor: 'rgba(15, 23, 42, 0.3)',
                borderRadius: '1.5rem',
                minHeight: '400px'
            }}>
                {activeTab === 'bulk' && <PricingBulk />}
                {activeTab === 'lists' && <PricingLists />}
                {activeTab === 'policies' && <PricingPolicies />}
            </main>
        </div>
    );
};

export default PricingStrategy;
