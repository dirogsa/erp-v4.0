import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('erp_token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                // Pre-check: Is the token malformed or expired? (Client side)
                const payload = JSON.parse(atob(token.split('.')[1]));
                const isExpired = payload.exp * 1000 < Date.now();

                if (isExpired) {
                    localStorage.removeItem('erp_token');
                    setLoading(false);
                    return;
                }

                // Check token validity with server
                const response = await authService.getMe();
                setUser(response.data);
                setIsAuthenticated(true);
            } catch (error) {
                // If the error is 401, it's just a normal expiration
                if (error.response?.status !== 401) {
                    console.error("Auth initialization error:", error);
                }
                localStorage.removeItem('erp_token');
            } finally {
                setLoading(false);
            }
        };
        initAuth();
    }, []);

    const login = async (username, password) => {
        try {
            const response = await authService.login(username, password);
            const { access_token } = response.data;
            localStorage.setItem('erp_token', access_token);

            const userRes = await authService.getMe();
            setUser(userRes.data);
            setIsAuthenticated(true);
            return userRes.data;
        } catch (error) {
            console.error("AuthProvider: Login error", error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('erp_token');
        setUser(null);
        setIsAuthenticated(false);
    };

    const isSuperAdmin = user?.role === 'SUPERADMIN';
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isAuthenticated,
            login,
            logout,
            isAdmin,
            isSuperAdmin
        }}>
            {children}
        </AuthContext.Provider>
    );
};
