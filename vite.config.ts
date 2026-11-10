import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith('VITE_')) continue;
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }

  const plugins = [react()];

  if (mode === 'development') {
    const { lazyDropApiPlugin } = await import('./server/plugin');
    plugins.push(lazyDropApiPlugin());
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'router': ['react-router-dom'],
          },
        },
      },
      target: 'es2020',
      minify: 'esbuild',
      sourcemap: false,
    },
    optimizeDeps: {
      include: ['lucide-react'],
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      fs: {
        allow: ['..'],
      },
    },
  };
});
