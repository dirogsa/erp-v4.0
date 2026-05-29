import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function ReviewsManager() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/marketing/reviews');
      setReviews(res.data);
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.patch(`/marketing/reviews/${id}/approve`);
      fetchReviews();
    } catch (err) {
      console.error(err);
      alert("Error al aprobar reseña");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta reseña permanentemente?")) return;
    try {
      await api.delete(`/marketing/reviews/${id}`);
      fetchReviews();
    } catch (err) {
      console.error(err);
      alert("Error al eliminar reseña");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Moderación de Reseñas UGC</h1>
          <p className="text-gray-500 mt-1">Controla el contenido generado por usuarios para potenciar el SEO.</p>
        </div>
        <button onClick={fetchReviews} className="px-4 py-2 bg-white border shadow-sm rounded-lg hover:bg-gray-50 flex items-center gap-2 font-medium">
          ↻ Actualizar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Producto (SKU)</th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Autor</th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Calificación</th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Comentario</th>
                <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reviews.map(r => (
                <tr key={r._id} className={!r.is_approved ? 'bg-yellow-50/30' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {r.is_approved ? (
                      <span className="px-3 py-1 inline-flex text-[10px] leading-5 font-black rounded-full bg-green-100 text-green-800 uppercase tracking-widest">
                        Aprobado
                      </span>
                    ) : (
                      <span className="px-3 py-1 inline-flex text-[10px] leading-5 font-black rounded-full bg-yellow-100 text-yellow-800 uppercase tracking-widest animate-pulse">
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{r.product_sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{r.user_name}</div>
                    {r.is_verified_buyer && <div className="text-[10px] text-blue-600 font-bold uppercase">Verificado</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-yellow-400 text-lg">
                      {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={r.comment}>
                    {r.comment || <span className="italic text-gray-400">Sin comentario</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {!r.is_approved && (
                      <button onClick={() => handleApprove(r._id)} className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1.5 rounded-lg mr-3 transition-colors">
                        ✓ Aprobar
                      </button>
                    )}
                    <button onClick={() => handleDelete(r._id)} className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {reviews.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No hay reseñas registradas aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
