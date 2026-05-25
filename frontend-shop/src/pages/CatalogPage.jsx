import React from 'react';
import { Helmet } from 'react-helmet-async';
import Catalog from '../components/Catalog';

const CatalogPage = () => {
    return (
        <main className="max-w-7xl mx-auto px-4 py-12">
            <Helmet>
                <title>Catálogo Completo de Filtros Automotrices | DIROGSA</title>
                <meta name="description" content="Explora nuestro catálogo de filtros premium para vehículos en el Perú: filtros de aire, aceite, cabina y combustible con calidad OEM. Búsqueda por SKU, vehículo o equivalencias." />
                <link rel="canonical" href="https://dirogsa.com/catalog" />
                <meta property="og:type" content="website" />
                <meta property="og:title" content="Catálogo de Filtros Premium | DIROGSA" />
                <meta property="og:description" content="Encuentra filtros automotrices premium con calidad OEM. Búsqueda avanzada y cruces de códigos equivalentes." />
                <meta property="og:image" content="https://dirogsa.com/og-default.jpg" />
                <meta property="og:url" content="https://dirogsa.com/catalog" />
            </Helmet>
            <Catalog />
        </main>
    );
};

export default CatalogPage;
