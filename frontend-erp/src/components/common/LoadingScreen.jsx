import React from 'react';

const LoadingScreen = ({ message = "Cargando..." }) => {
    return (
        <div className="loading-screen">
            <div className="loader-content">
                <div className="spinner">
                    <div className="double-bounce1"></div>
                    <div className="double-bounce2"></div>
                </div>
                <p className="loading-text">{message}</p>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .loading-screen {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: #0f172a;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                }
                .loader-content {
                    text-align: center;
                }
                .spinner {
                    width: 60px;
                    height: 60px;
                    position: relative;
                    margin: 0 auto 20px;
                }
                .double-bounce1, .double-bounce2 {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background-color: #3b82f6;
                    opacity: 0.6;
                    position: absolute;
                    top: 0;
                    left: 0;
                    animation: sk-bounce 2.0s infinite ease-in-out;
                }
                .double-bounce2 {
                    animation-delay: -1.0s;
                }
                .loading-text {
                    color: #94a3b8;
                    font-size: 1rem;
                    font-weight: 600;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                }
                @keyframes sk-bounce {
                    0%, 100% { transform: scale(0.0); }
                    50% { transform: scale(1.0); }
                }
            `}} />
        </div>
    );
};

export default LoadingScreen;
