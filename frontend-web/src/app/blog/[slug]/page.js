import { notFound } from 'next/navigation';
import Link from 'next/link';

// Mock data fetcher. En producción, esto consultaría al CMS o API.
async function getPostBySlug(slug) {
  const posts = {
    'cuando-cambiar-filtro-aire': {
      title: '¿Cómo saber cuándo cambiar el filtro de aire de tu auto?',
      date: '2026-05-28',
      author: 'Equipo Técnico Dirogsa',
      content: `
        El filtro de aire es como los pulmones de tu vehículo. Un filtro sucio o deteriorado impide que el motor "respire" correctamente, lo que puede causar desde un aumento en el consumo de combustible hasta daños severos en los cilindros por el ingreso de partículas.

        ### Síntomas de que necesitas cambiar el filtro
        1. **Pérdida de potencia:** El motor se siente "asfixiado" al acelerar.
        2. **Humo negro en el escape:** Una mezcla rica en combustible por falta de aire.
        3. **Luz de Check Engine:** Los sensores de oxígeno detectan anomalías en la mezcla.

        Recomendamos revisar el filtro cada 10,000 km, especialmente si conduces en zonas muy polvorientas o en el tráfico pesado de Lima.
      `
    }
  };
  return posts[slug] || null;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  
  if (!post) {
    return { title: 'Artículo no encontrado | DIROGSA' };
  }

  return {
    title: `${post.title} | Blog DIROGSA Perú`,
    description: post.content.substring(0, 150) + '...',
    openGraph: {
      title: post.title,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author]
    }
  };
}

export default async function BlogPost({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  // JSON-LD Article Schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    datePublished: post.date,
    author: [{
      '@type': 'Organization',
      name: post.author,
      url: 'https://dirogsa.com'
    }]
  };

  return (
    <article className="max-w-3xl mx-auto px-5 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      <Link href="/blog" className="text-[10px] uppercase font-black tracking-widest text-[#38BDF8] hover:text-white transition-colors mb-8 inline-flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Volver al Blog
      </Link>

      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
          {post.title}
        </h1>
        <div className="flex items-center gap-4 text-sm text-gray-400 font-mono">
          <span>{post.date}</span>
          <span>•</span>
          <span>{post.author}</span>
        </div>
      </header>

      {/* 
        NOTA ARQUITECTÓNICA: En producción, usar una librería como 'react-markdown' 
        o 'next-mdx-remote' para renderizar el content de forma segura.
      */}
      <div className="prose prose-invert prose-lg max-w-none prose-headings:font-black prose-headings:text-white prose-a:text-[#38BDF8]">
        {post.content.split('\n\n').map((paragraph, i) => {
          if (paragraph.trim().startsWith('###')) {
            return <h3 key={i} className="text-2xl mt-8 mb-4">{paragraph.replace('###', '').trim()}</h3>;
          }
          return <p key={i} className="mb-6 leading-relaxed text-gray-300">{paragraph.trim()}</p>;
        })}
      </div>
    </article>
  );
}
