import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './common/Loading';

const ProtectedRoute = ({ children, requireAdmin = true }) => {
    const { isAuthenticated, loading, isAdmin } = useAuth();
    const location = useLocation();

    if (loading) {
        return <Loading />;
    }

    if (!isAuthenticated) {
        // Redirigir al login pero guardando la ubicación actual
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requireAdmin && !isAdmin) {
        // Si requiere admin y no lo es, redirigir al dashboard o página de error
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
