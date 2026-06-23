/**
 * /blog/[slug]/page.js — Artículo individual del Blog
 * CONSTITUTION §3: Datos en lib/blog-posts.js, esta página es mensajera.
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BLOG_POSTS, getPostBySlug } from '@/lib/blog-posts';
import { SITE_URL } from '@/config/seo.config';

export const revalidate = 86400; // 24h — artículos cambian poco

/** Pre-genera todas las páginas de blog en build-time desde la fuente de verdad. */
export async function generateStaticParams() {
  return BLOG_POSTS.map(post => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) return { title: 'Artículo no encontrado | DIROGSA' };

  return {
    title: `${post.title} | Blog DIROGSA Perú`,
    description: post.excerpt,
    alternates: { canonical: `${SITE_URL}/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      url: `${SITE_URL}/blog/${post.slug}`,
    },
  };
}

export default async function BlogPost({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  // JSON-LD Article Schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: [{
      '@type': 'Organization',
      name: post.author,
      url: SITE_URL,
    }],
    publisher: {
      '@type': 'Organization',
      name: 'DIROGSA',
      url: SITE_URL,
    },
  };

  return (
    <article className="max-w-3xl mx-auto px-5 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── BREADCRUMB ── */}
      <nav aria-label="Ruta de navegación" className="mb-8">
        <ol className="flex items-center gap-2 text-xs list-none p-0 m-0" style={{ color: 'var(--brand-text-dim)' }}>
          <li><Link href="/" className="hover:text-white transition-colors">Inicio</Link></li>
          <li aria-hidden="true"><span className="opacity-40">/</span></li>
          <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
          <li aria-hidden="true"><span className="opacity-40">/</span></li>
          <li className="text-white font-bold truncate max-w-[200px]" aria-current="page">{post.title}</li>
        </ol>
      </nav>

      <header className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--brand-primary)' }}>
            {post.category}
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
          {post.title}
        </h1>
        <div className="flex items-center gap-4 text-sm text-gray-400 font-mono">
          <span>{post.date}</span>
          <span>•</span>
          <span>{post.author}</span>
        </div>
      </header>

      <div className="prose prose-invert prose-lg max-w-none prose-headings:font-black prose-headings:text-white prose-a:text-[#38BDF8]">
        {post.content.split('\n\n').map((paragraph, i) => {
          const trimmed = paragraph.trim();
          if (!trimmed) return null;
          if (trimmed.startsWith('###')) {
            return <h3 key={i} className="text-2xl mt-8 mb-4">{trimmed.replace('###', '').trim()}</h3>;
          }
          if (trimmed.startsWith('##')) {
            return <h2 key={i} className="text-3xl mt-10 mb-5">{trimmed.replace('##', '').trim()}</h2>;
          }
          return <p key={i} className="mb-6 leading-relaxed text-gray-300">{trimmed}</p>;
        })}
      </div>

      {/* ── CTA ── */}
      <div className="mt-16 p-8 rounded-[2rem] text-center"
           style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.15)' }}>
        <p className="text-white font-black text-lg mb-2">¿Necesitas los repuestos correctos?</p>
        <p className="text-sm text-gray-400 mb-6">Encuentra filtros compatibles con tu vehículo en nuestro catálogo verificado.</p>
        <Link href="/catalog"
          className="inline-flex px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:brightness-110"
          style={{ background: '#38BDF8', color: '#0A0A0B' }}>
          Ver Catálogo →
        </Link>
      </div>
    </article>
  );
}
