import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// ─── Plugin: sirve imágenes externas en dev ──────────────────────────────────
function serveExternalImages() {
  return {
    name: 'serve-external-images',
    configureServer(server) {
      server.middlewares.use('/shared-images/', (req, res, next) => {
        const fileName  = req.url.split('?')[0].replace(/^\//, '');
        const imagePath = path.resolve(__dirname, '../images', fileName);

        if (fs.existsSync(imagePath) && fs.statSync(imagePath).isFile()) {
          const ext = path.extname(imagePath).toLowerCase();
          const mimeTypes = {
            '.webp': 'image/webp',
            '.png':  'image/png',
            '.jpg':  'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.svg':  'image/svg+xml',
          };
          res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          res.end(fs.readFileSync(imagePath));
        } else {
          next();
        }
      });
    },
  };
}

// ─── Chunking granular por librería ─────────────────────────────────────────
// Estrategia: cada vendor grande → chunk propio con nombre estable.
// Las páginas ya se parten solas gracias al lazy() en App.jsx.
function manualChunks(id) {
  if (!id.includes('node_modules')) return;

  // React core — siempre el primero en cargar
  if (id.includes('react-dom') || id.includes('/react/') || id.includes('react-is')) {
    return 'vendor-react';
  }

  // Router
  if (id.includes('react-router') || id.includes('@remix-run')) {
    return 'vendor-router';
  }

  // Charts (recharts es ~350kB y solo se usa en Dashboard / Reports)
  if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) {
    return 'vendor-charts';
  }

  // Data fetching
  if (id.includes('@tanstack')) {
    return 'vendor-query';
  }

  // HTTP
  if (id.includes('axios')) {
    return 'vendor-axios';
  }

  // State
  if (id.includes('zustand')) {
    return 'vendor-state';
  }

  // Iconos (lucide + heroicons pueden pesar bastante)
  if (id.includes('lucide-react') || id.includes('@heroicons')) {
    return 'vendor-icons';
  }

  // Print (react-to-print)
  if (id.includes('react-to-print')) {
    return 'vendor-print';
  }

  // Resto de node_modules → vendor genérico
  return 'vendor-misc';
}

// ─── Config ──────────────────────────────────────────────────────────────────
export default defineConfig({
  plugins: [react(), serveExternalImages()],

  build: {
    // Sube el límite solo para que el warning no aparezca en el único chunk
    // grande que queda (vendor-react + vendor-charts pueden llegar a ~400kB).
    // El número real de bytes importa menos que el gzip (~200kB).
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        manualChunks,
        // Nombres de chunk predecibles para caché de largo plazo
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
