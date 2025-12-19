import React from 'react';
import Layout from '../components/Layout';
import LossesSection from '../components/features/inventory/LossesSection';

const Losses = () => {
    return (
        <Layout>
            <h2 style={{ marginBottom: '1.5rem' }}>Gestión de Mermas</h2>
            <LossesSection />
        </Layout>
    );
};

export default Losses;
