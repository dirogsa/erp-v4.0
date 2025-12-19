import React, { useState } from 'react';
import { authService } from '../services/api';
import { CheckCircleIcon, RocketLaunchIcon, BuildingOfficeIcon, UserIcon, PhoneIcon, EnvelopeIcon, MapPinIcon } from '@heroicons/react/24/outline';

const B2BApplicationPage = () => {
    const [formData, setFormData] = useState({
        ruc: '',
        company_name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: ''
    });
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        try {
            await authService.applyB2B(formData);
            setStatus('success');
        } catch (error) {
            setStatus('error');
            setErrorMessage(error.response?.data?.detail || 'Ocurrió un error al enviar la solicitud.');
        }
    };

    if (status === 'success') {
        return (
            <div className="max-w-3xl mx-auto px-4 py-24 text-center">
                <div className="bg-emerald-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-emerald-100">
                    <CheckCircleIcon className="h-12 w-12 text-emerald-600" />
                </div>
                <h2 className="text-4xl font-black text-slate-900 mb-4">¡Solicitud Enviada!</h2>
                <p className="text-slate-500 text-xl leading-relaxed mb-10">
                    Hemos recibido tus datos correctamente. Nuestro equipo revisará la información de tu empresa
                    y se contactará contigo en un plazo de **24 a 48 horas** para activar tu cuenta B2B.
                </p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl"
                >
                    VOLVER AL INICIO
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Info Side */}
            <div className="space-y-10">
                <div>
                    <span className="bg-primary-50 text-primary-600 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4 inline-block">
                        Programa de Distribuidores
                    </span>
                    <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tighter leading-tight">
                        Haz crecer tu negocio con precios <span className="text-primary-600">B2B</span>
                    </h1>
                    <p className="text-slate-500 text-xl leading-relaxed">
                        Únete a nuestra red de talleres y distribuidoras certificadas. Accede a stock en tiempo real
                        y los mejores precios de importación del Perú.
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="flex gap-6 items-start">
                        <div className="bg-primary-100 p-3 rounded-2xl text-primary-600">
                            <RocketLaunchIcon className="h-7 w-7" />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-slate-800">Precios Mayoristas</h4>
                            <p className="text-slate-500">Descuentos escalonados según tu volumen de compra mensual.</p>
                        </div>
                    </div>
                    <div className="flex gap-6 items-start">
                        <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
                            <CheckCircleIcon className="h-7 w-7" />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-slate-800">Soporte Técnico Especializado</h4>
                            <p className="text-slate-500">Un asesor dedicado para ayudarte con aplicaciones críticas y conversiones.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                    <p className="text-primary-400 font-black text-5xl mb-2">5,000+</p>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Empresas confían en nosotros</p>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                </div>
            </div>

            {/* Form Side */}
            <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border border-slate-50">
                <h3 className="text-3xl font-black text-slate-900 mb-8">Datos de la Empresa</h3>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-400 ml-2">RUC de la Empresa</label>
                            <div className="relative">
                                <BuildingOfficeIcon className="absolute left-4 top-4 h-5 w-5 text-slate-300" />
                                <input
                                    required
                                    name="ruc"
                                    value={formData.ruc}
                                    onChange={handleChange}
                                    placeholder="20XXXXXXXXX"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all placeholder:text-slate-300"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-400 ml-2">Razón Social</label>
                            <input
                                required
                                name="company_name"
                                value={formData.company_name}
                                onChange={handleChange}
                                placeholder="Nombre de la empresa"
                                className="w-full px-5 py-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all placeholder:text-slate-300"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-slate-400 ml-2">Persona de Contacto</label>
                        <div className="relative">
                            <UserIcon className="absolute left-4 top-4 h-5 w-5 text-slate-300" />
                            <input
                                required
                                name="contact_person"
                                value={formData.contact_person}
                                onChange={handleChange}
                                placeholder="Nombre completo"
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all placeholder:text-slate-300"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-400 ml-2">Correo Corporativo</label>
                            <div className="relative">
                                <EnvelopeIcon className="absolute left-4 top-4 h-5 w-5 text-slate-300" />
                                <input
                                    required
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="empresa@ejemplo.com"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all placeholder:text-slate-300"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-400 ml-2">Teléfono / WhatsApp</label>
                            <div className="relative">
                                <PhoneIcon className="absolute left-4 top-4 h-5 w-5 text-slate-300" />
                                <input
                                    required
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+51 900 000 000"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all placeholder:text-slate-300"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-slate-400 ml-2">Dirección Fiscal</label>
                        <div className="relative">
                            <MapPinIcon className="absolute left-4 top-4 h-5 w-5 text-slate-300" />
                            <input
                                required
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Calle, Distrito, Provincia"
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all placeholder:text-slate-300"
                            />
                        </div>
                    </div>

                    {status === 'error' && (
                        <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-bold border border-rose-100 animate-in fade-in slide-in-from-top-2">
                            {errorMessage}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className={`w-full py-5 rounded-2xl font-black text-xl transition-all shadow-xl flex items-center justify-center gap-3 ${status === 'loading'
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-primary-600 text-white hover:bg-primary-500 shadow-primary-600/20 active:scale-[0.98]'
                            }`}
                    >
                        {status === 'loading' ? (
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400"></div>
                        ) : 'ENVIAR SOLICITUD B2B'}
                    </button>

                    <p className="text-center text-slate-400 text-xs mt-6">
                        Al enviar este formulario, aceptas nuestros términos de tratamiento de datos comerciales.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default B2BApplicationPage;
