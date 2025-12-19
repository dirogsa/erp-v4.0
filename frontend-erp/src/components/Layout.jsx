import React from 'react';
import Sidebar from './navigation/Sidebar';

const Layout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    return (
        <div className="app-container">
            <button
                className="sidebar-toggle"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                title={isSidebarOpen ? "Cerrar menú" : "Abrir menú"}
            >
                {isSidebarOpen ? '✕' : '☰'}
            </button>

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Overlay to close sidebar on mobile */}
            {isSidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

export default Layout;
