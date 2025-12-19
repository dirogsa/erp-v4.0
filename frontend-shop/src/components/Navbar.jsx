import { useState } from 'react';
import { ShoppingCartIcon, UserIcon, MagnifyingGlassIcon, ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { cartCount } = useCart();
    const { user, isAuthenticated, logout, isB2B } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <nav className="bg-white shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20 items-center">
                    {/* Mobile Menu Button + Logo */}
                    <div className="flex items-center gap-4">
                        {/* Hamburger Button (Mobile Only) */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 text-slate-600 hover:text-primary-600 transition-colors"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? (
                                <XMarkIcon className="h-7 w-7" />
                            ) : (
                                <Bars3Icon className="h-7 w-7" />
                            )}
                        </button>

                        {/* Logo */}
                        <Link to="/" className="text-3xl font-black text-primary-600 tracking-tighter hover:opacity-80 transition-opacity">
                            FILTROS<span className="text-slate-400">SHOP</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation Links */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link to="/" className="font-bold text-slate-600 hover:text-primary-600 transition-colors">Inicio</Link>
                        <Link to="/catalog" className="font-bold text-slate-600 hover:text-primary-600 transition-colors">Catálogo</Link>
                        <Link to="/b2b" className="font-bold text-primary-600 bg-primary-50 px-4 py-2 rounded-xl border border-primary-100">B2B Empresas</Link>
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-4 md:gap-6">
                        {/* Search Bar (Desktop Only) */}
                        <div className="hidden lg:block relative">
                            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar SKU..."
                                className="pl-12 pr-6 py-2.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 w-64 transition-all"
                            />
                        </div>

                        {/* Cart */}
                        <Link to="/cart" className="p-2 text-slate-500 hover:text-primary-600 transition-colors relative">
                            <ShoppingCartIcon className="h-7 w-7" />
                            {cartCount > 0 && (
                                <span className="absolute top-0 right-0 bg-primary-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full ring-2 ring-white animate-in zoom-in duration-300">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {/* User Account */}
                        {isAuthenticated ? (
                            <div className="hidden sm:flex items-center gap-4">
                                <Link to="/profile" className="flex items-center gap-2 text-slate-700 hover:text-primary-600 transition-all font-bold">
                                    <div className="bg-slate-100 p-2 rounded-xl">
                                        <UserIcon className="h-5 w-5" />
                                    </div>
                                    <div className="hidden lg:block text-left leading-tight">
                                        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Mi Perfil</div>
                                        <div className="text-sm truncate max-w-[120px]">{user?.full_name?.split(' ')[0]}</div>
                                    </div>
                                </Link>
                                <button
                                    onClick={logout}
                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                    title="Cerrar Sesión"
                                >
                                    <ArrowRightOnRectangleIcon className="h-6 w-6" />
                                </button>
                            </div>
                        ) : (
                            <Link to="/login" className="hidden sm:flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl hover:bg-slate-800 transition-all font-bold shadow-lg shadow-slate-900/10">
                                <UserIcon className="h-5 w-5" />
                                <span>Mi Cuenta</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 top-20 bg-white z-40 shadow-2xl animate-in slide-in-from-top duration-300">
                    <div className="flex flex-col h-full">
                        {/* Search Bar (Mobile) */}
                        <div className="p-4 border-b border-slate-100">
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar SKU..."
                                    className="w-full pl-12 pr-6 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <div className="flex-1 overflow-y-auto py-6 px-4">
                            <div className="space-y-2">
                                <Link
                                    to="/"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block py-4 px-6 text-lg font-bold text-slate-700 hover:bg-slate-50 hover:text-primary-600 rounded-2xl transition-all"
                                >
                                    🏠 Inicio
                                </Link>
                                <Link
                                    to="/catalog"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block py-4 px-6 text-lg font-bold text-slate-700 hover:bg-slate-50 hover:text-primary-600 rounded-2xl transition-all"
                                >
                                    📦 Catálogo
                                </Link>
                                <Link
                                    to="/b2b"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block py-4 px-6 text-lg font-bold bg-primary-50 text-primary-600 rounded-2xl border-2 border-primary-100 hover:bg-primary-100 transition-all"
                                >
                                    🏢 B2B Empresas
                                </Link>
                            </div>

                            {/* User Section (Mobile) */}
                            <div className="mt-8 pt-6 border-t border-slate-100">
                                {isAuthenticated ? (
                                    <div className="space-y-2">
                                        <Link
                                            to="/profile"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center gap-4 py-4 px-6 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all"
                                        >
                                            <div className="bg-slate-200 p-3 rounded-xl">
                                                <UserIcon className="h-6 w-6 text-slate-700" />
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-400 uppercase tracking-widest font-black">Mi Cuenta</div>
                                                <div className="font-bold text-slate-900">{user?.full_name}</div>
                                            </div>
                                        </Link>
                                        <button
                                            onClick={() => {
                                                logout();
                                                setMobileMenuOpen(false);
                                            }}
                                            className="w-full flex items-center justify-center gap-2 py-4 px-6 text-red-600 font-bold hover:bg-red-50 rounded-2xl transition-all"
                                        >
                                            <ArrowRightOnRectangleIcon className="h-5 w-5" />
                                            Cerrar Sesión
                                        </button>
                                    </div>
                                ) : (
                                    <Link
                                        to="/login"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center justify-center gap-3 py-4 px-6 bg-slate-900 text-white rounded-2xl font-bold shadow-lg hover:bg-slate-800 transition-all"
                                    >
                                        <UserIcon className="h-6 w-6" />
                                        Iniciar Sesión
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
