import React from 'react';
import { Truck, Building2, MapPin, Store, Package, AlertCircle, CheckCircle2, DollarSign, Info } from 'lucide-react';
import Input from '../../common/Input';
import { formatCurrency } from '../../../utils/formatters';

const AGENCIES = [
    { name: 'Shalom', popular: true },
    { name: 'Marvisur', popular: true },
    { name: 'Olva Courier', popular: true },
    { name: 'Flores Hermanos', popular: false },
    { name: 'Expreso Cavassa', popular: false },
    { name: 'Cruz del Sur Cargo', popular: false },
    { name: 'Movil Bus', popular: false }
];

const SUGGESTED_RATES = [10, 15, 20, 25, 30];

const DeliveryMethodSection = ({
    deliveryMethod = 'STORE_PICKUP',
    onDeliveryMethodChange,
    shippingCost = 0,
    onShippingCostChange,
    shippingAgency = '',
    onShippingAgencyChange,
    shippingPaymentType = 'PAID', // 'PAID' | 'DESTINATION'
    onShippingPaymentTypeChange,
    shippingNotes = '',
    onShippingNotesChange,
    deliveryAddress = '',
    onDeliveryAddressChange,
    deliveryBranchName = '',
    itemsTotal = 0,
    currency = 'PEN',
    readOnly = false
}) => {
    const symbol = currency === 'USD' || currency === 'DOLARES' ? '$' : 'S/';
    const costNumber = parseFloat(shippingCost) || 0;
    const isSmallOrder = itemsTotal > 0 && itemsTotal < 150;
    const isBigOrder = itemsTotal >= 300;

    const handleSelectMethod = (method) => {
        if (readOnly) return;
        onDeliveryMethodChange(method);
        if (method === 'STORE_PICKUP') {
            onShippingCostChange(0);
        } else if (method === 'LOCAL_DELIVERY' && costNumber === 0) {
            onShippingCostChange(15); // Suggested default
            onShippingPaymentTypeChange('PAID');
        } else if (method === 'AGENCY_SHIPPING') {
            if (!shippingAgency) {
                onShippingAgencyChange('Shalom');
            }
            if (shippingPaymentType === 'DESTINATION') {
                onShippingCostChange(0);
            }
        }
    };

    return (
        <div style={{
            padding: '1.5rem',
            backgroundColor: '#1e293b',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            border: '1px solid #334155'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '0.5rem'
            }}>
                <h3 style={{
                    color: '#e2e8f0',
                    fontSize: '1.1rem',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <Truck size={20} style={{ color: '#38bdf8' }} />
                    Despacho y Logística de Entrega
                </h3>

                {/* Status Pill */}
                <div style={{
                    fontSize: '0.8rem',
                    padding: '0.3rem 0.8rem',
                    borderRadius: '9999px',
                    fontWeight: 600,
                    backgroundColor: deliveryMethod === 'STORE_PICKUP' ? '#334155' : '#0369a1',
                    color: deliveryMethod === 'STORE_PICKUP' ? '#94a3b8' : '#e0f2fe',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                }}>
                    {deliveryMethod === 'STORE_PICKUP' && '🏢 Recojo en Almacén (S/ 0.00)'}
                    {deliveryMethod === 'LOCAL_DELIVERY' && `🛵 Movilidad Local (${formatCurrency(costNumber, symbol)})`}
                    {deliveryMethod === 'AGENCY_SHIPPING' && (
                        shippingPaymentType === 'DESTINATION'
                            ? `🚛 ${shippingAgency || 'Agencia'} (Pago en Destino)`
                            : `🚛 ${shippingAgency || 'Agencia'} (${formatCurrency(costNumber, symbol)})`
                    )}
                </div>
            </div>

            {/* Smart Commercial Advisor Banner */}
            {isSmallOrder && !readOnly && deliveryMethod !== 'STORE_PICKUP' && costNumber === 0 && shippingPaymentType !== 'DESTINATION' && (
                <div style={{
                    backgroundColor: '#451a03',
                    border: '1px solid #b45309',
                    borderRadius: '0.375rem',
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fef3c7', fontSize: '0.85rem' }}>
                        <AlertCircle size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
                        <span>
                            <strong>Pedido menor a S/ 150.00:</strong> Se sugiere aplicar recargo de movilidad para cubrir costo de flete/reparto.
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            onShippingCostChange(15);
                            onShippingPaymentTypeChange('PAID');
                        }}
                        style={{
                            backgroundColor: '#f59e0b',
                            color: '#0f172a',
                            border: 'none',
                            borderRadius: '0.25rem',
                            padding: '0.35rem 0.75rem',
                            fontWeight: '600',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                        }}
                    >
                        + Aplicar S/ 15.00
                    </button>
                </div>
            )}

            {isBigOrder && !readOnly && costNumber > 0 && (
                <div style={{
                    backgroundColor: '#064e3b',
                    border: '1px solid #059669',
                    borderRadius: '0.375rem',
                    padding: '0.5rem 1rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#d1fae5',
                    fontSize: '0.8rem'
                }}>
                    <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                    <span>
                        Pedido mayor a S/ 300.00 (Califica para cortesía comercial si se desea bonificar el flete).
                    </span>
                </div>
            )}

            {/* Method Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
                marginBottom: '1.25rem'
            }}>
                {/* 1. Recojo en Almacen */}
                <div
                    onClick={() => handleSelectMethod('STORE_PICKUP')}
                    style={{
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        backgroundColor: deliveryMethod === 'STORE_PICKUP' ? '#0f172a' : '#1e293b',
                        border: deliveryMethod === 'STORE_PICKUP' ? '2px solid #38bdf8' : '1px solid #334155',
                        cursor: readOnly ? 'default' : 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: deliveryMethod === 'STORE_PICKUP' ? '0 0 12px rgba(56, 189, 248, 0.2)' : 'none'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Store size={18} style={{ color: deliveryMethod === 'STORE_PICKUP' ? '#38bdf8' : '#94a3b8' }} />
                            <span style={{ fontWeight: 600, color: 'white', fontSize: '0.95rem' }}>Recojo en Tienda</span>
                        </div>
                        <span style={{
                            fontSize: '0.75rem',
                            backgroundColor: '#334155',
                            color: '#94a3b8',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px'
                        }}>
                            GRATIS
                        </span>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0, lineHeight: 1.3 }}>
                        El cliente retira personalmente en Almacén Central DIROGSA.
                    </p>
                </div>

                {/* 2. Delivery Local / Movilidad */}
                <div
                    onClick={() => handleSelectMethod('LOCAL_DELIVERY')}
                    style={{
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        backgroundColor: deliveryMethod === 'LOCAL_DELIVERY' ? '#0f172a' : '#1e293b',
                        border: deliveryMethod === 'LOCAL_DELIVERY' ? '2px solid #38bdf8' : '1px solid #334155',
                        cursor: readOnly ? 'default' : 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: deliveryMethod === 'LOCAL_DELIVERY' ? '0 0 12px rgba(56, 189, 248, 0.2)' : 'none'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Truck size={18} style={{ color: deliveryMethod === 'LOCAL_DELIVERY' ? '#38bdf8' : '#94a3b8' }} />
                            <span style={{ fontWeight: 600, color: 'white', fontSize: '0.95rem' }}>Delivery / Movilidad</span>
                        </div>
                        <span style={{
                            fontSize: '0.75rem',
                            backgroundColor: deliveryMethod === 'LOCAL_DELIVERY' ? '#0369a1' : '#334155',
                            color: deliveryMethod === 'LOCAL_DELIVERY' ? '#e0f2fe' : '#94a3b8',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            fontWeight: 600
                        }}>
                            {costNumber > 0 ? formatCurrency(costNumber, symbol) : 'S/ 0.00'}
                        </span>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0, lineHeight: 1.3 }}>
                        Envío local a taller o cliente (motorizado, furgón o courier).
                    </p>
                </div>

                {/* 3. Agencia Interprovincial */}
                <div
                    onClick={() => handleSelectMethod('AGENCY_SHIPPING')}
                    style={{
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        backgroundColor: deliveryMethod === 'AGENCY_SHIPPING' ? '#0f172a' : '#1e293b',
                        border: deliveryMethod === 'AGENCY_SHIPPING' ? '2px solid #38bdf8' : '1px solid #334155',
                        cursor: readOnly ? 'default' : 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: deliveryMethod === 'AGENCY_SHIPPING' ? '0 0 12px rgba(56, 189, 248, 0.2)' : 'none'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Package size={18} style={{ color: deliveryMethod === 'AGENCY_SHIPPING' ? '#38bdf8' : '#94a3b8' }} />
                            <span style={{ fontWeight: 600, color: 'white', fontSize: '0.95rem' }}>Envío a Provincia</span>
                        </div>
                        <span style={{
                            fontSize: '0.75rem',
                            backgroundColor: deliveryMethod === 'AGENCY_SHIPPING' ? '#0369a1' : '#334155',
                            color: deliveryMethod === 'AGENCY_SHIPPING' ? '#e0f2fe' : '#94a3b8',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            fontWeight: 600
                        }}>
                            {shippingPaymentType === 'DESTINATION' ? 'En Destino' : (costNumber > 0 ? formatCurrency(costNumber, symbol) : 'S/ 0.00')}
                        </span>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0, lineHeight: 1.3 }}>
                        Despacho a terminal o agencia de transporte terrestre.
                    </p>
                </div>
            </div>

            {/* Contextual Options depending on Delivery Method */}

            {/* CASE 1: STORE_PICKUP */}
            {deliveryMethod === 'STORE_PICKUP' && (
                <div style={{
                    backgroundColor: '#0f172a',
                    padding: '1rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #334155'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                        <Building2 size={16} style={{ color: '#38bdf8' }} />
                        <span>
                            <strong>Punto de retiro:</strong> Almacén Principal de DIROGSA (Lima). No se aplica cargo de flete.
                        </span>
                    </div>
                </div>
            )}

            {/* CASE 2: LOCAL_DELIVERY */}
            {deliveryMethod === 'LOCAL_DELIVERY' && (
                <div style={{
                    backgroundColor: '#0f172a',
                    padding: '1rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #334155',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 2fr', gap: '1rem', alignItems: 'flex-start' }}>
                        <div>
                            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                                Costo de Movilidad ({symbol})
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={shippingCost === 0 ? '0' : shippingCost}
                                onChange={(e) => onShippingCostChange(parseFloat(e.target.value) || 0)}
                                disabled={readOnly}
                                style={{
                                    width: '100%',
                                    padding: '0.6rem 0.75rem',
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #38bdf8',
                                    borderRadius: '0.25rem',
                                    color: 'white',
                                    fontSize: '1.1rem',
                                    fontWeight: 'bold',
                                    outline: 'none'
                                }}
                            />

                            {/* Quick Rate Buttons */}
                            {!readOnly && (
                                <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b', alignSelf: 'center', marginRight: '0.2rem' }}>Sugeridos:</span>
                                    {SUGGESTED_RATES.map((rate) => (
                                        <button
                                            key={rate}
                                            type="button"
                                            onClick={() => onShippingCostChange(rate)}
                                            style={{
                                                backgroundColor: costNumber === rate ? '#0284c7' : '#1e293b',
                                                border: '1px solid #334155',
                                                borderRadius: '3px',
                                                color: costNumber === rate ? 'white' : '#cbd5e1',
                                                padding: '0.2rem 0.45rem',
                                                fontSize: '0.75rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {rate}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => onShippingCostChange(0)}
                                        style={{
                                            backgroundColor: costNumber === 0 ? '#475569' : '#1e293b',
                                            border: '1px solid #334155',
                                            borderRadius: '3px',
                                            color: '#94a3b8',
                                            padding: '0.2rem 0.45rem',
                                            fontSize: '0.75rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Gratis (0)
                                    </button>
                                </div>
                            )}
                        </div>

                        <div>
                            <Input
                                label="Referencia o instrucciones para el repartidor"
                                value={shippingNotes || ''}
                                onChange={(e) => onShippingNotesChange(e.target.value)}
                                placeholder="Ej: Entregar en taller de 9am a 5pm, preguntar por Juan"
                                disabled={readOnly}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* CASE 3: AGENCY_SHIPPING */}
            {deliveryMethod === 'AGENCY_SHIPPING' && (
                <div style={{
                    backgroundColor: '#0f172a',
                    padding: '1rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #334155',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    {/* Agency Selector Pills */}
                    <div>
                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                            Agencia de Transporte Terrestre
                        </label>
                        {!readOnly && (
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                                {AGENCIES.map((ag) => (
                                    <button
                                        key={ag.name}
                                        type="button"
                                        onClick={() => onShippingAgencyChange(ag.name)}
                                        style={{
                                            backgroundColor: shippingAgency === ag.name ? '#0284c7' : '#1e293b',
                                            border: shippingAgency === ag.name ? '1px solid #38bdf8' : '1px solid #334155',
                                            borderRadius: '4px',
                                            color: shippingAgency === ag.name ? 'white' : '#cbd5e1',
                                            padding: '0.35rem 0.75rem',
                                            fontSize: '0.8rem',
                                            cursor: 'pointer',
                                            fontWeight: ag.popular ? '600' : 'normal'
                                        }}
                                    >
                                        {ag.name}
                                    </button>
                                ))}
                            </div>
                        )}
                        <Input
                            value={shippingAgency || ''}
                            onChange={(e) => onShippingAgencyChange(e.target.value)}
                            placeholder="Nombre de la agencia (ej: Shalom, Marvisur...)"
                            disabled={readOnly}
                        />
                    </div>

                    {/* Freight Payment Mode (Origen vs Destino) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 1fr', gap: '1rem', alignItems: 'flex-start' }}>
                        <div>
                            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                                Modalidad del Flete
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    color: 'white',
                                    fontSize: '0.85rem',
                                    cursor: readOnly ? 'default' : 'pointer'
                                }}>
                                    <input
                                        type="radio"
                                        name="shipping_payment_type"
                                        value="DESTINATION"
                                        checked={shippingPaymentType === 'DESTINATION'}
                                        onChange={() => {
                                            onShippingPaymentTypeChange('DESTINATION');
                                            onShippingCostChange(0);
                                        }}
                                        disabled={readOnly}
                                    />
                                    <strong>Pago en Destino (Flete por pagar)</strong>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>(El cliente paga a la agencia)</span>
                                </label>

                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    color: 'white',
                                    fontSize: '0.85rem',
                                    cursor: readOnly ? 'default' : 'pointer'
                                }}>
                                    <input
                                        type="radio"
                                        name="shipping_payment_type"
                                        value="PAID"
                                        checked={shippingPaymentType === 'PAID'}
                                        onChange={() => {
                                            onShippingPaymentTypeChange('PAID');
                                            if (costNumber === 0) onShippingCostChange(15);
                                        }}
                                        disabled={readOnly}
                                    />
                                    <strong>Flete / Traslado a agencia pagado</strong>
                                    <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>(Se cobra en la cotización)</span>
                                </label>
                            </div>
                        </div>

                        {shippingPaymentType === 'PAID' && (
                            <div>
                                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                                    Monto de Traslado / Flete ({symbol})
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={shippingCost === 0 ? '0' : shippingCost}
                                    onChange={(e) => onShippingCostChange(parseFloat(e.target.value) || 0)}
                                    disabled={readOnly}
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem 0.75rem',
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #38bdf8',
                                        borderRadius: '0.25rem',
                                        color: 'white',
                                        fontSize: '1.1rem',
                                        fontWeight: 'bold',
                                        outline: 'none'
                                    }}
                                />
                                {!readOnly && (
                                    <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.5rem' }}>
                                        {[10, 15, 20, 25].map(r => (
                                            <button
                                                key={r}
                                                type="button"
                                                onClick={() => onShippingCostChange(r)}
                                                style={{
                                                    backgroundColor: costNumber === r ? '#0284c7' : '#1e293b',
                                                    border: '1px solid #334155',
                                                    borderRadius: '3px',
                                                    color: 'white',
                                                    padding: '0.15rem 0.4rem',
                                                    fontSize: '0.75rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <Input
                        label="Ciudad destino o Sede de la agencia"
                        value={shippingNotes || ''}
                        onChange={(e) => onShippingNotesChange(e.target.value)}
                        placeholder="Ej: Agencia Shalom Trujillo Centro / Consignado a nombre de Juan Pérez"
                        disabled={readOnly}
                    />
                </div>
            )}
        </div>
    );
};

export default DeliveryMethodSection;
