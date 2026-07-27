import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

// PORT and BASE_PATH are required for the dev/preview server but not during
// `vite build` — the build step runs in Replit's CI environment where these
// vars are not injected.  Default to safe values so the build succeeds.
const isBuildCommand = process.argv.some((a) => a === 'build');

const rawPort = process.env.PORT;
if (!rawPort && !isBuildCommand) {
  throw new Error(
    'PORT environment variable is required but was not provided.',
  );
}
const port = Number(rawPort ?? '3000');
if (rawPort && (Number.isNaN(port) || port <= 0)) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
      // Force all packages (privy, tanstack-query, etc.) to resolve to the
      // same single React instance — prevents "Invalid hook call" errors that
      // occur when a shared library bundles a separate React copy.
      'react': path.resolve(import.meta.dirname, 'node_modules', 'react'),
      'react-dom': path.resolve(import.meta.dirname, 'node_modules', 'react-dom'),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
