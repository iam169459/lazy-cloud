import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { lazyDropApiPlugin } from './server/plugin';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith('VITE_')) continue;
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }

  return {
    plugins: [react(), lazyDropApiPlugin()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    esbuild: {
      pure: ['Math.floor', 'Math.random'],
      drop: ['console', 'debugger'],
    },
    css: {
      minify: 'esbuild',
    },
    server: {
      fs: {
        allow: ['..'],
      },
    },
    build: {
      minify: 'esbuild',
      target: 'es2022',
      sourcemap: 'hidden',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
  };
});
