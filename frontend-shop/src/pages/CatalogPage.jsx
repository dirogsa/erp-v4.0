import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import Catalog from '../components/Catalog';

const CatalogPage = () => {
    const { make, model } = useParams();

    let pageTitle = "Catálogo Completo de Filtros Automotrices | DIROGSA";
    let pageDesc = "Explora nuestro catálogo de filtros premium para vehículos en el Perú: filtros de aire, aceite, cabina y combustible con calidad OEM. Búsqueda por SKU, vehículo o equivalencias.";

    if (make && model) {
        pageTitle = `Filtros para ${make.toUpperCase()} ${model.toUpperCase()} | DIROGSA Perú`;
        pageDesc = `Catálogo de filtros compatibles para ${make.toUpperCase()} ${model.toUpperCase()}. Filtros de aceite, aire y combustible al mejor precio en Perú.`;
    } else if (make) {
        pageTitle = `Filtros para vehículos ${make.toUpperCase()} | DIROGSA Perú`;
        pageDesc = `Catálogo completo de filtros para la marca ${make.toUpperCase()}. Encuentra compatibilidades exactas.`;
    }

    return (
        <main className="max-w-7xl mx-auto px-4 py-12">
            <Helmet>
                <title>{pageTitle}</title>
                <meta name="description" content={pageDesc} />
                <link rel="canonical" href="https://dirogsa.com/catalog" />
                <meta property="og:type" content="website" />
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content={pageDesc} />
                <meta property="og:image" content="https://dirogsa.com/og-default.jpg" />
                <meta property="og:url" content="https://dirogsa.com/catalog" />
            </Helmet>
            <Catalog initialMake={make} initialModel={model} />
        </main>
    );
};

export default CatalogPage;
