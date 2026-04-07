import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    HomeIcon,
    TagIcon,
    GiftIcon,
    UserIcon,
    ShoppingCartIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const BottomNav = () => {
    const navItems = [
        { name: 'Inicio', icon: HomeIcon, path: '/' },
        { name: 'Buscar', icon: MagnifyingGlassIcon, path: '/search' },
        { name: 'Carrito', icon: ShoppingCartIcon, path: '/cart' },
        { name: 'Premios', icon: GiftIcon, path: '/prizes' },
        { name: 'Perfil', icon: UserIcon, path: '/profile' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-brand-surface border-t border-brand-border/30 safe-bottom z-[60] backdrop-blur-xl shadow-2xl">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) => `
                            flex flex-col items-center justify-center w-full h-full space-y-1
                            transition-all duration-300 active:scale-90
                            ${isActive ? 'text-brand-primary' : 'text-brand-muted'}
                        `}
                    >
                        <item.icon className={`h-5 w-5 transition-transform ${item.name === 'Carrito' ? 'scale-110' : ''}`} />
                        <span className="text-[8px] font-black uppercase tracking-widest">{item.name}</span>
                        
                        {/* Indicador de pestaña activa minimalista */}
                        <div className={`
                            absolute bottom-1 h-1 w-1 rounded-full bg-brand-primary transition-all duration-300
                            ${(location.pathname === item.path) ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
                        `}></div>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

export default BottomNav;
