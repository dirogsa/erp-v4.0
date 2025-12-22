import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useNotification } from '../hooks/useNotification';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { showNotification } = useNotification();

    const from = location.state?.from?.pathname || "/";

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("LoginPage: Form submitted with username:", username);
        setLoading(true);
        try {
            console.log("LoginPage: Calling login function from context...");
            await login(username, password);
            console.log("LoginPage: Login successful, navigating to:", from);
            showNotification('¡Bienvenido al sistema!', 'success');
            navigate(from, { replace: true });
        } catch (error) {
            console.error("LoginPage: Login caught error:", error);
            let msg = 'Error de conexión con el servidor';

            if (error.response) {
                console.log("LoginPage: Server responded with error status:", error.response.status);
                msg = error.response.data?.detail || 'Credenciales incorrectas';
            } else if (error.request) {
                console.log("LoginPage: No response received from server (network error/CORS)");
                msg = 'No se pudo conectar con el servidor. Verifique la configuración de CORS o su conexión.';
            }

            showNotification(msg, 'error');
        } finally {
            setLoading(false);
            console.log("LoginPage: Loading state set to false");
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh',
            padding: '1rem'
        }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
                        Acceso Administrativo
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                        ERP v4.0 - Panel de Gestión
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Input
                        label="Usuario"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        autoComplete="username"
                        placeholder="admin"
                    />

                    <Input
                        label="Contraseña"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        placeholder="••••••••"
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        style={{ width: '100%', marginTop: '1rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Iniciando sesión...' : 'Entrar al Sistema'}
                    </Button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>
                    <p>Si no tienes acceso, contacta con el Superadmin.</p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
