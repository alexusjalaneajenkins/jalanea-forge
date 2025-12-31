import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    // base removed - Vercel uses root URL
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    // API key is now server-side only (Vercel API route)
    // No need to expose it to the frontend
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      sourcemap: false,
      minify: false,
    }
  };
});
