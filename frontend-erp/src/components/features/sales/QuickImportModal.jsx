import React from 'react';
import ExcelImportModal from '../../common/ExcelImportModal';
import { inventoryService } from '../../../services/api';
import { cleanSku } from '../../../utils/formatters';

const QuickImportModal = ({ visible, onClose, onImport }) => {

    const handleValidate = async (rawRows, mapping) => {
        const finalItems = [];
        const errors = [];
        const allSkus = rawRows.map(row => row[mapping.sku]?.trim()).filter(Boolean);
        
        if (allSkus.length === 0) {
            return { valid: [], ambiguous: [], errors: ['No se encontraron SKUs válidos.'] };
        }

        try {
            const res = await inventoryService.bulkFetchProducts(allSkus);
            const productsList = res.data;
            
            const productsMap = {};
            productsList.forEach(p => {
                const cSku = cleanSku(p.sku);
                if (!productsMap[cSku]) productsMap[cSku] = [];
                productsMap[cSku].push(p);
            });

            for (let i = 0; i < rawRows.length; i++) {
                const row = rawRows[i];
                const sku = row[mapping.sku]?.trim();
                const qty = parseFloat(row[mapping.quantity]) || 1;
                const price = parseFloat(row[mapping.price]) || null;

                if (!sku) continue;

                const variations = productsMap[cleanSku(sku)];
                if (variations && variations.length > 0) {
                    const product = variations[0]; // TODO: Ambiguity resolution for Sales if needed later
                    finalItems.push({
                        product_sku: product.sku,
                        product_name: product.name,
                        brand: product.brand,
                        quantity: qty,
                        unit_price: price || product.price_list,
                        price_list: product.price_list,
                        promo_discount_pct: product.promo_discount_pct || 0,
                        stock: product.stock_current || 0,
                        sku_variations: variations,
                        subtotal: qty * (price || product.price_list)
                    });
                } else {
                    errors.push(`Fila ${i + 1}: SKU "${sku}" no encontrado.`);
                }
            }
        } catch (err) {
            console.error(err);
            errors.push('Error crítico conectando al servidor para consulta masiva.');
        }

        return { valid: finalItems, ambiguous: [], errors };
    };

    const validTableHeaders = ['SKU', 'Producto', 'Cant.', 'Total'];
    const renderValidRow = (item, i) => (
        <tr key={i} style={{ borderTop: '1px solid #334155' }}>
            <td style={{ padding: '0.75rem', fontWeight: '500' }}>{item.product_sku}</td>
            <td style={{ padding: '0.75rem' }}>{item.product_name}</td>
            <td style={{ padding: '0.75rem', textAlign: 'center' }}>{item.quantity}</td>
            <td style={{ padding: '0.75rem', textAlign: 'right', color: '#10b981' }}>S/ {item.subtotal.toFixed(2)}</td>
        </tr>
    );

    return (
        <ExcelImportModal
            visible={visible}
            onClose={onClose}
            onImport={onImport}
            title="Importar Productos Rápido"
            columns={[
                { key: 'sku', label: '📍 SKU / Código' },
                { key: 'quantity', label: '🔢 Cantidad' },
                { key: 'price', label: '💰 Precio (Opcional)' }
            ]}
            onValidate={handleValidate}
            validTableHeaders={validTableHeaders}
            renderValidRow={renderValidRow}
            allowAmbiguityResolution={false}
        />
    );
};

export default QuickImportModal;
