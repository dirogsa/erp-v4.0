'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function SolicitarAccesoPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    ruc: '',
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: ''
  });
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_BASE}/api/v1/auth/apply-b2b`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Error al enviar la solicitud');
      }
      
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-5 relative overflow-hidden">
        <div className="card-premium w-full max-w-md relative z-10 text-center space-y-6 p-8">
          <div className="h-20 w-20 mx-auto bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-white uppercase">Solicitud Enviada</h2>
          <p className="text-sm text-brand-text-dim">
            Hemos recibido los datos de <strong className="text-white">{formData.company_name}</strong>. Nuestro equipo validará la información y nos pondremos en contacto en un plazo de 24 a 48 horas.
          </p>
          <Link href="/" className="inline-flex items-center justify-center h-12 px-6 rounded-xl font-black text-xs uppercase tracking-widest bg-white/5 hover:bg-white/10 transition-all text-white w-full border border-white/10 mt-4">
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-5 relative overflow-hidden">
      
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="card-premium w-full max-w-2xl relative z-10 space-y-8 p-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase">Solicitud B2B</h1>
          <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>
            Únete a nuestra red exclusiva de distribuidores y accede a precios mayoristas
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest pl-1 text-brand-text-dim">RUC</label>
            <input type="text" required value={formData.ruc} onChange={e => setFormData({...formData, ruc: e.target.value})} className="tech-input w-full h-12 rounded-xl px-4 text-sm font-bold text-white placeholder-brand-text-dim/50" placeholder="Ej: 20123456789" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest pl-1 text-brand-text-dim">Razón Social</label>
            <input type="text" required value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} className="tech-input w-full h-12 rounded-xl px-4 text-sm font-bold text-white placeholder-brand-text-dim/50" placeholder="Ej: Filtros Industriales SAC" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest pl-1 text-brand-text-dim">Persona de Contacto</label>
            <input type="text" required value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} className="tech-input w-full h-12 rounded-xl px-4 text-sm font-bold text-white placeholder-brand-text-dim/50" placeholder="Ej: Juan Pérez" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest pl-1 text-brand-text-dim">Correo Comercial</label>
            <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="tech-input w-full h-12 rounded-xl px-4 text-sm font-bold text-white placeholder-brand-text-dim/50" placeholder="Ej: compras@empresa.com" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest pl-1 text-brand-text-dim">Teléfono Móvil</label>
            <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="tech-input w-full h-12 rounded-xl px-4 text-sm font-bold text-white placeholder-brand-text-dim/50" placeholder="Ej: +51 987654321" />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest pl-1 text-brand-text-dim">Dirección Fiscal / Entrega</label>
            <input type="text" required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="tech-input w-full h-12 rounded-xl px-4 text-sm font-bold text-white placeholder-brand-text-dim/50" placeholder="Ej: Av. Industrial 123, Lima" />
          </div>

          <div className="pt-4 md:col-span-2 space-y-4">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: 'var(--brand-primary)', color: '#0A0A0B' }}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-[#0A0A0B]/20 border-t-[#0A0A0B] rounded-full animate-spin" />
                  Enviando Solicitud...
                </>
              ) : (
                'Enviar Solicitud B2B'
              )}
            </button>
            <div className="text-center border-t border-brand-border pt-4">
              <Link href="/login" className="text-xs font-bold transition-colors" style={{ color: 'var(--brand-primary)' }}>
                ¿Ya tienes cuenta? Volver al inicio de sesión
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
