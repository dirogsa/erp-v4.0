import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { EnvelopeIcon, LockClosedIcon, UserIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        confirm_password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirm_password) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await authService.register({
                email: formData.email,
                password: formData.password,
                full_name: formData.full_name
            });
            alert("¡Registro exitoso! Ya puedes iniciar sesión.");
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.detail || 'Ocurrió un error durante el registro');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[90vh] flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-slate-50 relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-500 opacity-5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                    <div className="text-center mb-10">
                        <h2 className="text-4xl font-black text-slate-900 mb-2">Nueva Cuenta</h2>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Regístrate para comprar y ganar puntos</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-400 ml-2">Nombre Completo</label>
                            <div className="relative">
                                <UserIcon className="absolute left-4 top-4 h-5 w-5 text-slate-300" />
                                <input
                                    required
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    placeholder="Ej: Juan Pérez"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-400 ml-2">Correo Electrónico</label>
                            <div className="relative">
                                <EnvelopeIcon className="absolute left-4 top-4 h-5 w-5 text-slate-300" />
                                <input
                                    required
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="cualquier@dominio.com"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-slate-400 ml-2">Contraseña</label>
                                <div className="relative">
                                    <LockClosedIcon className="absolute left-4 top-4 h-5 w-5 text-slate-300" />
                                    <input
                                        required
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all placeholder:text-slate-300"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-slate-400 ml-2">Confirmar Contraseña</label>
                                <div className="relative">
                                    <LockClosedIcon className="absolute left-4 top-4 h-5 w-5 text-slate-300" />
                                    <input
                                        required
                                        type="password"
                                        name="confirm_password"
                                        value={formData.confirm_password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all placeholder:text-slate-300"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-bold border border-rose-100 animate-in fade-in slide-in-from-top-2">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-5 rounded-2xl font-black text-xl transition-all shadow-xl flex items-center justify-center gap-3 ${loading
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-primary-600 text-white hover:bg-primary-500 shadow-primary-600/20 active:scale-[0.98]'
                                }`}
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400"></div>
                            ) : (
                                <>CREAR CUENTA <ArrowRightIcon className="h-6 w-6" /></>
                            )}
                        </button>
                    </form>

                    <p className="mt-10 text-center text-slate-500 font-medium">
                        ¿Ya tienes una cuenta? {' '}
                        <Link to="/login" className="text-primary-600 font-black hover:underline">Inicia sesión</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
