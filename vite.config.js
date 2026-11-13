import { defineConfig } from 'vite';

// base relativa: el build funciona en cualquier subruta (GitHub Pages, Netlify, Vercel, hosting propio)
export default defineConfig({
  base: './',
  server: { port: 5173 },
});
