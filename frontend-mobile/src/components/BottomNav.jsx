import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    HomeIcon,
    TagIcon,
    GiftIcon,
    UserIcon,
    ShoppingCartIcon,
    MagnifyingGlassIcon,
    ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

const BottomNav = () => {
    const location = useLocation();
    
    const navItems = [
        { name: 'Inicio', icon: HomeIcon, path: '/' },
        { name: 'Buscar', icon: MagnifyingGlassIcon, path: '/search' },
        { name: 'Carrito', icon: ShoppingCartIcon, path: '/cart' },
        { name: 'Pedidos', icon: ClipboardDocumentListIcon, path: '/orders' },
        { name: 'Perfil', icon: UserIcon, path: '/profile' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 glass-card border-t border-white/5 safe-bottom z-[60] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="flex justify-around items-center h-20">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) => `
                            flex flex-col items-center justify-center w-full h-full space-y-1.5
                            transition-all duration-300 active:scale-90 relative
                            ${isActive ? 'text-brand-primary' : 'text-brand-text-muted'}
                        `}
                    >
                        <item.icon className={`h-6 w-6 transition-all duration-500 ${location.pathname === item.path ? 'scale-110 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'opacity-70'}`} />
                        
                        {/* Indicador de pestaña activa minimalista */}
                        <div className={`
                            absolute bottom-2 h-1.5 w-1.5 rounded-full bg-brand-primary transition-all duration-500
                            ${(location.pathname === item.path) ? 'opacity-100 scale-100 shadow-[0_0_10px_#10B981]' : 'opacity-0 scale-0'}
                        `}></div>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

export default BottomNav;
