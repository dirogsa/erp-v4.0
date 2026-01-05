import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('shop_token');
            if (token) {
                try {
                    const response = await authService.getMe();
                    setUser(response.data);
                    setIsAuthenticated(true);
                } catch (error) {
                    console.error("Session expired or invalid token");
                    localStorage.removeItem('shop_token');
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);


    const login = async (username, password) => {
        const response = await authService.login({ username, password });
        const { access_token } = response.data;
        localStorage.setItem('shop_token', access_token);

        const userRes = await authService.getMe();
        setUser(userRes.data);
        setIsAuthenticated(true);
        return userRes.data;
    };

    const logout = () => {
        localStorage.removeItem('shop_token');
        setUser(null);
        setIsAuthenticated(false);
    };

    const refreshProfile = async () => {
        try {
            const response = await authService.getMe();
            setUser(response.data);
            return response.data;
        } catch (error) {
            console.error("Error refreshing profile", error);
        }
    };

    const isB2B = user?.role === 'CUSTOMER_B2B';
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isAuthenticated,
            login,
            logout,
            refreshProfile,
            isB2B,
            isAdmin
        }}>
            {children}
        </AuthContext.Provider>
    );
};
