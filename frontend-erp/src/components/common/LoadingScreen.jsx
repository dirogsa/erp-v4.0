import React from 'react';
import Loading from './Loading';

/**
 * LoadingScreen: Wrapper premium para bloqueos de pantalla completa.
 * Utilizado principalmente durante el arranque de módulos o autenticación.
 */
const LoadingScreen = ({ message = "Iniciando Sistema..." }) => {
    return (
        <Loading 
            fullScreen={true} 
            size="large" 
            text={message} 
            color="#6366f1" 
        />
    );
};

export default LoadingScreen;
