import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { shopService } from '../services/api';
import { UserCircleIcon, StarIcon, ShoppingBagIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const ProfilePage = () => {
    const { user } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await shopService.getProfile();
                setProfileData(response.data);
            } catch (error) {
                console.error("Error fetching profile", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen pt-24 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 bg-gray-50">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header/Cover */}
                    <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>

                    <div className="px-8 pb-8">
                        <div className="relative flex justify-between items-end -mt-12 mb-6">
                            <div className="p-1 bg-white rounded-full">
                                <div className="bg-gray-100 rounded-full p-4">
                                    <UserCircleIcon className="h-24 w-24 text-gray-400" />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Link to="/orders" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                    <ShoppingBagIcon className="h-5 w-5" />
                                    Mis Pedidos
                                </Link>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Info Detail */}
                            <div className="md:col-span-2">
                                <h1 className="text-2xl font-bold text-gray-900">{profileData?.full_name}</h1>
                                <p className="text-gray-500 mb-6">{profileData?.email}</p>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                                        <span>Miembro desde {new Date(profileData?.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 uppercase tracking-wider">
                                        {profileData?.role === 'customer_b2b' ? 'Socio Mayorista B2B' : 'Cliente Minorista'}
                                    </div>
                                </div>
                            </div>

                            {/* Stats Cards */}
                            <div className="space-y-4">
                                <div className="bg-yellow-50 border border-yellow-100 p-6 rounded-2xl">
                                    <div className="flex items-center gap-2 text-yellow-800 font-bold mb-1">
                                        <StarIcon className="h-5 w-5" />
                                        Puntos de Fidelidad
                                    </div>
                                    <div className="text-3xl font-black text-yellow-600">
                                        {profileData?.loyalty_points || 0}
                                    </div>
                                    <p className="text-xs text-yellow-700 mt-2">Canjeables por descuentos en tus próximas compras.</p>
                                </div>

                                <div className="bg-green-50 border border-green-100 p-6 rounded-2xl">
                                    <div className="text-green-800 font-bold mb-1 uppercase text-xs tracking-widest">
                                        Ventas Acumuladas
                                    </div>
                                    <div className="text-2xl font-black text-green-600">
                                        S/ {profileData?.cumulative_sales?.toFixed(2) || '0.00'}
                                    </div>
                                    <p className="text-xs text-green-700 mt-2">Total invertido en nuestra tienda.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
