import React, { createContext, useState, useContext, useCallback } from 'react';
import LoadingOverlay from '../components/common/LoadingOverlay';

const LoadingContext = createContext();

/**
 * Proveedor Global de Estados de Espera.
 * Permite mostrar un mensaje de carga desde cualquier parte de la app.
 */
export const LoadingProvider = ({ children }) => {
    const [state, setState] = useState({
        visible: false,
        message: '',
        subMessage: ''
    });

    const showLoading = useCallback((message = "Procesando...", subMessage = "Sincronizando con el servidor, por favor espere.") => {
        setState({
            visible: true,
            message,
            subMessage
        });
    }, []);

    const hideLoading = useCallback(() => {
        setState(prev => ({ ...prev, visible: false }));
    }, []);

    return (
        <LoadingContext.Provider value={{ showLoading, hideLoading }}>
            {children}
            <LoadingOverlay 
                visible={state.visible} 
                message={state.message} 
                subMessage={state.subMessage} 
            />
        </LoadingContext.Provider>
    );
};

export const useLoading = () => {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error('useLoading debe ser usado dentro de un LoadingProvider');
    }
    return context;
};
