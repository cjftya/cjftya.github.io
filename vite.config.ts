import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    host: true,
  },
  preview: {
    host: true,
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        viola: resolve(import.meta.dirname, 'projects/viola/index.html'),
        uriel: resolve(import.meta.dirname, 'projects/uriel/index.html'),
      },
    },
  },
});
