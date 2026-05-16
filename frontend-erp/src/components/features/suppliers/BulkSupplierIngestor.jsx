import React, { useRef } from 'react';
import IndustrialIngestor from '../../common/IndustrialIngestor';
import { magicIngest } from '../../../utils/fiscalParser';
import { Truck, ShieldCheck } from 'lucide-react';

const BulkSupplierIngestor = ({ onComplete, onCancel }) => {
    const ingestorRef = useRef();

    // Motor de Parsing para Proveedores (Texto pegado)
    const handleParse = (text) => {
        const blocks = text.split(/Número de RUC:/i).filter(b => b.trim().length > 20);
        
        return blocks.map(block => {
            const data = magicIngest("Número de RUC: " + block);
            if (data) {
                return {
                    ...data,
                    id: data.document_number || data.ruc,
                    status: 'pending'
                };
            }
            return null;
        }).filter(Boolean);
    };

    // Motor de Procesamiento de Archivos HTML
    const handleFiles = async (files) => {
        const allDetected = [];
        for (const file of files) {
            try {
                const text = await file.text();
                const detected = handleParse(text);
                if (detected.length > 0) {
                    allDetected.push(...detected);
                } else {
                    const single = magicIngest(text);
                    if (single?.document_number || single?.ruc) {
                        allDetected.push({
                            ...single,
                            id: single.document_number || single.ruc,
                            status: 'pending'
                        });
                    }
                }
            } catch (err) {
                console.error(`Error leyendo archivo ${file.name}:`, err);
            }
        }
        
        if (allDetected.length > 0) {
            ingestorRef.current.addItems(allDetected);
        }
    };

    // Motor de Persistencia
    const handlePersist = async (items) => {
        for (const entity of items) {
            const payload = {
                ...entity,
                ruc: entity.document_number || entity.ruc,
                is_active: true
            };
            await onComplete(payload);
        }
    };

    const columns = [
        { 
            label: 'Identidad Fiscal', 
            key: 'document_number',
            render: (val, row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.5rem', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '0.75rem', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                        <ShieldCheck size={18} color="#eab308" />
                    </div>
                    <div>
                        <div style={{ fontWeight: '900', color: '#eab308', fontFamily: "'JetBrains Mono', monospace", fontSize: '1.1rem', letterSpacing: '0.05em' }}>
                            {val || row.ruc}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.1rem' }}>
                            Perú • Registro Único
                        </div>
                    </div>
                </div>
            )
        },
        { 
            label: 'Razón Social / Nombre', 
            key: 'name',
            render: (val) => <span style={{ color: 'white', fontWeight: '700', fontSize: '1rem' }}>{val}</span>
        },
        { 
            label: 'Estado SUNAT', 
            key: 'sunat_state',
            render: (val, row) => (
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                    {val && (
                        <span style={{ 
                            fontSize: '0.75rem', padding: '0.35rem 0.85rem', borderRadius: '0.75rem', fontWeight: '900',
                            background: val === 'ACTIVO' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: val === 'ACTIVO' ? '#10b981' : '#f87171',
                            border: `1px solid ${val === 'ACTIVO' ? '#10b98144' : '#f8717144'}`,
                            textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}>
                            {val}
                        </span>
                    )}
                    {row.sunat_condition && (
                        <span style={{ 
                            fontSize: '0.75rem', padding: '0.35rem 0.85rem', borderRadius: '0.75rem', fontWeight: '900',
                            background: row.sunat_condition === 'HABIDO' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            color: row.sunat_condition === 'HABIDO' ? '#3b82f6' : '#f59e0b',
                            border: `1px solid ${row.sunat_condition === 'HABIDO' ? '#3b82f644' : '#f59e0b44'}`,
                            textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}>
                            {row.sunat_condition}
                        </span>
                    )}
                    {!val && !row.sunat_condition && (
                        <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '800', fontStyle: 'italic' }}>
                            Análisis en curso...
                        </span>
                    )}
                </div>
            )
        }
    ];

    return (
        <div style={{ padding: '1rem 0' }}>
            <IndustrialIngestor
                ref={ingestorRef}
                title="Sincronizador Global de Proveedores"
                subtitle="Detección industrial de maestros para la cadena de suministro industrial."
                icon={Truck}
                iconColor="#eab308"
                onParse={handleParse}
                onFilesDetected={handleFiles}
                onPersist={handlePersist}
                columns={columns}
                previewTitle="Proveedores Detectados para Sincronización"
                processButtonText="Registrar Proveedores"
                allowText={false}
            />
            
            <div style={{ marginTop: '3rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2.5rem' }}>
                <button 
                    onClick={onCancel}
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: '#64748b', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '700', padding: '0.75rem 2rem', borderRadius: '1rem', transition: 'all 0.3s' }}
                    onMouseOver={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                >
                    ← Volver al Directorio Maestro
                </button>
            </div>
        </div>
    );
};

export default BulkSupplierIngestor;
