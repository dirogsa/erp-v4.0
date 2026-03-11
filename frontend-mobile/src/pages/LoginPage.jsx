import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(username, password);
            navigate('/');
        } catch (err) {
            setError('Credenciales inválidas o error de conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col justify-center px-6 py-12 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative z-10 w-full max-w-sm mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
                        DIROGSA <span className="text-primary-500">mobile</span>
                    </h1>
                    <p className="text-slate-400 font-medium">Accede a tu cuenta de socio</p>
                </div>

                <div className="bg-white/10 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-4 rounded-2xl text-center font-bold">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Usuario</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                                placeholder="tu_usuario"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-primary-600/20 hover:bg-primary-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                "INICIAR SESIÓN"
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center text-slate-500 text-sm">
                    ¿No tienes una cuenta? <br />
                    <span className="text-primary-400 font-bold">Contacta con tu asesor comercial</span>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
