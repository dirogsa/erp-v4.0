/**
 * /blog/page.js — Índice del Blog Técnico Automotriz
 * CONSTITUTION §3: Datos en lib/blog-posts.js, esta página es mensajera.
 */

import Link from 'next/link';
import { BLOG_POSTS } from '@/lib/blog-posts';
import { SITE_URL } from '@/config/seo.config';

export const metadata = {
  title: 'Blog Técnico Automotriz | DIROGSA Perú',
  description: 'Aprende sobre mantenimiento preventivo, equivalencias de filtros automotrices y guías técnicas para repuestos de vehículos en Perú.',
  alternates: { canonical: `${SITE_URL}/blog` },
};

export default function BlogIndex() {
  return (
    <div className="max-w-7xl mx-auto px-5 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
          Blog Técnico <span style={{ color: 'var(--brand-primary)' }}>Automotriz</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Guías de expertos, equivalencias y consejos de mantenimiento para alargar la vida útil de tu vehículo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {BLOG_POSTS.map((post) => (
          <Link href={`/blog/${post.slug}`} key={post.slug} className="group">
            <div className="rounded-[2rem] p-8 h-full flex flex-col transition-all duration-300 hover:-translate-y-2"
                 style={{ background: 'rgba(20,21,24,0.5)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>

              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full"
                      style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--brand-primary)' }}>
                  {post.category}
                </span>
                <span className="text-[10px] text-gray-500 font-mono">{post.date}</span>
              </div>

              <h2 className="text-xl font-bold text-white mb-4 leading-tight group-hover:text-[#38BDF8] transition-colors">
                {post.title}
              </h2>

              <p className="text-sm text-gray-400 leading-relaxed mb-6 flex-grow">
                {post.excerpt}
              </p>

              <div className="mt-auto flex items-center text-xs font-black uppercase tracking-widest" style={{ color: 'var(--brand-orange)' }}>
                Leer Artículo
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
