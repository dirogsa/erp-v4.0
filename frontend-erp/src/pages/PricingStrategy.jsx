import React, { useState } from 'react';
import PricingLists from './PricingLists';
import PricingBulk from './PricingBulk';
import PricingPolicies from './PricingPolicies';

const PricingStrategy = () => {
    const [activeTab, setActiveTab] = useState('console'); // 'console', 'lists', 'bulk', 'policies'

    const tabs = [
        { id: 'console', label: '🎮 Consola Maestro', icon: '📊' },
        { id: 'lists', label: '📋 Listas y Campañas', icon: '✨' },
        { id: 'policies', label: '🛡️ Reglas y Escudos', icon: '⚖️' },
        { id: 'bulk', label: '⚡ Ajuste Masivo', icon: '🚀' }
    ];

    return (
        <div style={{ padding: '2rem', minHeight: '100vh', backgroundColor: '#0f172a' }}>
            {/* Header Estratégico */}
            <header style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                    Estrategia de Precios Enterprise
                </h1>
                <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
                    Control centralizado de márgenes, campañas y políticas comerciales.
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
                {activeTab === 'console' && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📈</div>
                        <h2 style={{ color: 'white' }}>Monitor de Rendimiento Comercial</h2>
                        <p>Aquí verás el resumen de márgenes promedio y efectividad de listas en tiempo real.</p>
                        <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                            <div style={{ padding: '1.5rem', background: '#1e293b', borderRadius: '1rem', border: '1px solid #334155' }}>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>MÁRGEN PROMEDIO</div>
                                <div style={{ fontSize: '1.5rem', color: '#10b981', fontWeight: 'bold' }}>24.5%</div>
                            </div>
                            <div style={{ padding: '1.5rem', background: '#1e293b', borderRadius: '1rem', border: '1px solid #334155' }}>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>LISTAS ACTIVAS</div>
                                <div style={{ fontSize: '1.5rem', color: '#3b82f6', fontWeight: 'bold' }}>4</div>
                            </div>
                            <div style={{ padding: '1.5rem', background: '#1e293b', borderRadius: '1rem', border: '1px solid #334155' }}>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>SKU EN OFERTA</div>
                                <div style={{ fontSize: '1.5rem', color: '#f59e0b', fontWeight: 'bold' }}>128</div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'lists' && <PricingLists />}
                {activeTab === 'policies' && <PricingPolicies />}
                {activeTab === 'bulk' && <PricingBulk />}
            </main>
        </div>
    );
};

export default PricingStrategy;
