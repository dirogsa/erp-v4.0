'use client';

import { useState } from 'react';

export default function ReviewForm({ sku }) {
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/shop/products/${sku}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_name: userName, email, rating, comment })
      });

      if (!res.ok) throw new Error('Error al enviar');
      
      setStatus('success');
      setUserName('');
      setEmail('');
      setComment('');
      setRating(5);
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20 text-center">
        <h3 className="text-green-400 font-bold text-lg mb-2">¡Gracias por tu reseña!</h3>
        <p className="text-sm text-gray-400">Tu comentario ha sido enviado y está en revisión para ser publicado pronto.</p>
        <button onClick={() => setStatus('idle')} className="mt-4 text-xs font-black uppercase text-white bg-green-500/20 px-4 py-2 rounded-lg hover:bg-green-500/30">
          Escribir otra reseña
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-2xl" style={{ background: 'rgba(20,21,24,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <h3 className="text-white font-bold mb-4">Déjanos tu opinión</h3>
      
      <div className="mb-4">
        <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Calificación</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="text-2xl transition-transform hover:scale-110"
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
            >
              <span className={(hoveredRating || rating) >= star ? 'text-yellow-400' : 'text-gray-600'}>★</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Tu Nombre</label>
          <input 
            type="text" required
            value={userName} onChange={(e) => setUserName(e.target.value)}
            className="w-full bg-[#0A0A0B] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500" 
            placeholder="Ej. Juan Pérez"
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Email (No se publicará)</label>
          <input 
            type="email" required
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#0A0A0B] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500" 
            placeholder="juan@correo.com"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Comentario (Opcional)</label>
        <textarea 
          value={comment} onChange={(e) => setComment(e.target.value)}
          className="w-full bg-[#0A0A0B] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 min-h-[100px]" 
          placeholder="¿Qué te pareció el producto?"
        ></textarea>
      </div>

      {status === 'error' && <p className="text-red-400 text-sm mb-4">Hubo un error al enviar la reseña. Inténtalo de nuevo.</p>}

      <button 
        type="submit" disabled={status === 'submitting'}
        className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:brightness-110 disabled:opacity-50 text-black"
        style={{ background: 'var(--brand-primary)' }}
      >
        {status === 'submitting' ? 'Enviando...' : 'Enviar Reseña'}
      </button>
    </form>
  );
}
