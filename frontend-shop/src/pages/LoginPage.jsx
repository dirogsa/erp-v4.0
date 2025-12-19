import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserIcon, LockClosedIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const LoginPage = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(credentials.username, credentials.password);
            navigate('/catalog');
        } catch (err) {
            setError(err.response?.data?.detail || 'Usuario o contraseña incorrectos');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLoginPlaceholder = () => {
        alert("Integración con Google próximamente disponible.");
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-slate-50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500 opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>

                    <div className="text-center mb-10">
                        <h2 className="text-4xl font-black text-slate-900 mb-2">Bienvenido</h2>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Ingresa a tu cuenta de cliente</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-400 ml-2">Usuario</label>
                            <div className="relative">
                                <UserIcon className="absolute left-4 top-4 h-5 w-5 text-slate-300" />
                                <input
                                    required
                                    type="text"
                                    name="username"
                                    value={credentials.username}
                                    onChange={handleChange}
                                    placeholder="tu_usuario"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-400 ml-2">Contraseña</label>
                            <div className="relative">
                                <LockClosedIcon className="absolute left-4 top-4 h-5 w-5 text-slate-300" />
                                <input
                                    required
                                    type="password"
                                    name="password"
                                    value={credentials.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all placeholder:text-slate-300"
                                />
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
                                <>INGRESAR <ArrowRightIcon className="h-6 w-6" /></>
                            )}
                        </button>
                    </form>

                    <div className="relative my-10">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-100"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase font-black tracking-widest text-slate-300">
                            <span className="bg-white px-4">O continúa con</span>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogleLoginPlaceholder}
                        className="w-full py-4 border border-slate-200 rounded-2xl font-bold text-slate-600 flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-[0.98]"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-6 w-6" />
                        Google Login (Próximamente)
                    </button>

                    <p className="mt-10 text-center text-slate-500 font-medium">
                        ¿No tienes una cuenta? {' '}
                        <Link to="/register" className="text-primary-600 font-black hover:underline">Regístrate aquí</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
