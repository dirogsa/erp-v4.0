import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Plugin nativo de Vite para servir de forma segura tu carpeta global de imágenes
function serveExternalImages() {
  return {
    name: 'serve-external-images',
    configureServer(server) {
      server.middlewares.use('/shared-images/', (req, res, next) => {
        // req.url incluye la barra inicial, la quitamos para resolver la ruta
        const fileName = req.url.split('?')[0].replace(/^\//, '');
        const imagePath = path.resolve(__dirname, '../images', fileName);
        
        if (fs.existsSync(imagePath) && fs.statSync(imagePath).isFile()) {
          const ext = path.extname(imagePath).toLowerCase();
          const mimeTypes = {
            '.webp': 'image/webp',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.svg': 'image/svg+xml'
          };
          res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          res.end(fs.readFileSync(imagePath));
        } else {
          next();
        }
      });
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), serveExternalImages()],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
})
