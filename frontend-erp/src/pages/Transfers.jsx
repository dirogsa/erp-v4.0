import React from 'react';
import Layout from '../components/Layout';
import TransfersSection from '../components/features/inventory/TransfersSection';

const Transfers = () => {
    return (
        <Layout>
            <h2 style={{ marginBottom: '1.5rem' }}>Gestión de Transferencias</h2>
            <TransfersSection />
        </Layout>
    );
};

export default Transfers;
