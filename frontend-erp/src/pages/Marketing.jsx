import React, { useState, useEffect } from 'react';
import { marketingService } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const Marketing = () => {
    const { showNotification } = useNotification();
    const [config, setConfig] = useState({
        points_per_sole: 1,
        is_active: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const res = await marketingService.getLoyaltyConfig();
            setConfig(res.data);
        } catch (error) {
            console.error("Error loading loyalty config", error);
            showNotification("Error al cargar configuración de lealtad", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await marketingService.updateLoyaltyConfig(config);
            showNotification("Configuración actualizada correctamente", "success");
        } catch (error) {
            console.error("Error saving loyalty config", error);
            showNotification("Error al guardar configuración", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Cargando configuración...</div>;

    return (
        <div className="p-8 max-w-4xl">
            <h1 className="text-2xl font-bold mb-6">Marketing y Fidelización</h1>

            <div className="card bg-surface p-6 rounded-xl border border-border shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-primary">Configuración Global de Puntos</h2>
                <p className="text-sm text-gray-500 mb-6">
                    Define las reglas básicas de cómo tus clientes ganan puntos por sus compras.
                </p>

                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Puntos por cada Sol (S/) gastado"
                            type="number"
                            step="0.1"
                            value={config.points_per_sole}
                            onChange={(e) => setConfig({ ...config, points_per_sole: parseFloat(e.target.value) || 0 })}
                            placeholder="1.0"
                            helperText="Ej: Si es 1.0, por una compra de S/ 100 el cliente gana 100 puntos."
                        />

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-700">Estado del Programa de Lealtad</label>
                            <label className="flex items-center gap-2 cursor-pointer mt-2">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5"
                                    checked={config.is_active}
                                    onChange={(e) => setConfig({ ...config, is_active: e.target.checked })}
                                />
                                <span className={config.is_active ? 'text-green-600 font-bold' : 'text-gray-400'}>
                                    {config.is_active ? '✅ Activo' : '❌ Desactivado'}
                                </span>
                            </label>
                            <p className="text-[10px] text-gray-400 mt-1">
                                Si se desactiva, no se acumularán puntos nuevos en las ventas.
                            </p>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <h4 className="text-blue-800 font-bold text-sm mb-1 italic">💡 Tip de Estrategia:</h4>
                        <p className="text-blue-700 text-xs">
                            Recuerda que también puedes asignar puntos específicos a cada producto en el Inventario.
                            Si un producto tiene puntos asignados manualmente, esos tendrán prioridad sobre esta regla global.
                        </p>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border">
                        <Button
                            type="submit"
                            variant="primary"
                            loading={saving}
                        >
                            {saving ? 'Guardando...' : 'Aplicar Configuración'}
                        </Button>
                    </div>
                </form>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-center">
                    <div className="text-3xl mb-2">🎁</div>
                    <h3 className="font-bold text-gray-700">Premios de Canje</h3>
                    <p className="text-xs text-gray-500">
                        Marca productos en el Inventario con un "Costo en Puntos" para que aparezcan como canjeables.
                    </p>
                </div>
                <div className="card p-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-center">
                    <div className="text-3xl mb-2">📊</div>
                    <h3 className="font-bold text-gray-700">Líderes de Puntos</h3>
                    <p className="text-xs text-gray-500">
                        Próximamente: Ranking de clientes con más fidelidad.
                    </p>
                </div>
                <div className="card p-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-center">
                    <div className="text-3xl mb-2">💌</div>
                    <h3 className="font-bold text-gray-700">Campañas</h3>
                    <p className="text-xs text-gray-500">
                        Próximamente: Multiplicadores de puntos por tiempo limitado.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Marketing;
