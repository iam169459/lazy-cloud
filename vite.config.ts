import { defineConfig, loadEnv } from 'vite';
import type { PluginOption, UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// The explicit `Promise<UserConfig>` return type keeps the literals below
// contextually typed ('esbuild', 'none', …) instead of widening to `string`,
// which is what made `tsc --build` reject this file.
export default defineConfig(async ({ mode }): Promise<UserConfig> => {
  const env = loadEnv(mode, process.cwd(), '');

  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith('VITE_')) continue;
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }

  // `react()` already returns an array of plugins, so spread it — wrapping it
  // in another array made `plugins` a PluginOption[][] and broke both the push
  // below and the UserConfig type.
  const plugins: PluginOption[] = [...react()];

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
            'framer-motion': ['framer-motion'],
            'lucide': ['lucide-react'],
            'webauthn': ['@simplewebauthn/browser'],
            'crypto': ['otplib', 'qrcode'],
            'aws': ['@aws-sdk/client-s3', '@aws-sdk/lib-storage', '@aws-sdk/s3-request-presigner'],
          },
        },
      },
      target: 'es2020',
      minify: 'esbuild',
      sourcemap: false,
      cssCodeSplit: true,
      reportCompressedSize: true,
    },
    optimizeDeps: {
      include: ['lucide-react', 'framer-motion'],
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      fs: {
        allow: ['..'],
      },
    },
    esbuild: {
      treeShaking: true,
      legalComments: 'none',
    },
  };
});
