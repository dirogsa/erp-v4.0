import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    HomeIcon,
    TagIcon,
    GiftIcon,
    UserIcon,
    ShoppingCartIcon
} from '@heroicons/react/24/outline';

const BottomNav = () => {
    const navItems = [
        { name: 'Inicio', icon: HomeIcon, path: '/' },
        { name: 'Catálogo', icon: TagIcon, path: '/catalog' },
        { name: 'Carrito', icon: ShoppingCartIcon, path: '/cart' },
        { name: 'Premios', icon: GiftIcon, path: '/prizes' },
        { name: 'Perfil', icon: UserIcon, path: '/profile' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-bottom z-50">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) => `
              flex flex-col items-center justify-center w-full h-full space-y-1
              transition-colors duration-200
              ${isActive ? 'text-primary-600' : 'text-slate-400'}
            `}
                    >
                        <item.icon className="h-6 w-6" />
                        <span className="text-[10px] font-medium">{item.name}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

export default BottomNav;
