import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import removeConsole from 'vite-plugin-remove-console';
import { visualizer } from 'rollup-plugin-visualizer';
import { sentryVitePlugin } from '@sentry/vite-plugin';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isTest = mode === 'test' || process.env.VITEST === 'true';
  const appRelease =
    process.env.VITE_SENTRY_RELEASE ||
    process.env.SENTRY_RELEASE ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    process.env.npm_package_version ||
    'dev';
  const enableSentrySourceMaps = Boolean(
    process.env.SENTRY_AUTH_TOKEN &&
      process.env.SENTRY_ORG &&
      process.env.SENTRY_PROJECT,
  );

  return {
    server: {
      host: "::",
      port: 8080,
    },
    build: {
      sourcemap: enableSentrySourceMaps ? 'hidden' : false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return undefined;
            }

            if (
              id.includes('jspdf') ||
              id.includes('pdf-lib')
            ) {
              return 'pdf-vendor';
            }

            if (id.includes('fabric')) {
              return 'signature-vendor';
            }

            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('react-router-dom') ||
              id.includes('@tanstack/react-query') ||
              id.includes('next-themes')
            ) {
              return 'react-vendor';
            }

            if (
              id.includes('react-hook-form') ||
              id.includes('@hookform/resolvers') ||
              id.includes('/zod/')
            ) {
              return 'forms-vendor';
            }

            if (id.includes('@dnd-kit')) {
              return 'dnd-vendor';
            }

            if (
              id.includes('/date-fns/') ||
              id.includes('react-day-picker') ||
              id.includes('embla-carousel-react')
            ) {
              return 'date-vendor';
            }

            if (
              id.includes('lucide-react') ||
              id.includes('react-icons')
            ) {
              return 'icons-vendor';
            }

            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }

            if (
              id.includes('@radix-ui') ||
              id.includes('cmdk') ||
              id.includes('vaul')
            ) {
              return 'ui-vendor';
            }

            return 'vendor';
          },
        },
      },
    },
    plugins: [
      !isTest && react(),
      mode === 'production' && removeConsole(),
      process.env.BUNDLE_ANALYZE === 'true' &&
        visualizer({
          filename: 'dist/bundle-analysis.html',
          gzipSize: true,
          brotliSize: true,
          open: false,
        }),
      !isTest &&
        enableSentrySourceMaps &&
        sentryVitePlugin({
          org: process.env.SENTRY_ORG!,
          project: process.env.SENTRY_PROJECT!,
          authToken: process.env.SENTRY_AUTH_TOKEN!,
          telemetry: false,
          release: {
            name: appRelease,
            inject: true,
            create: true,
            finalize: true,
          },
          sourcemaps: {
            assets: './dist/**/*.{js,js.map,css,css.map}',
          },
          errorHandler(error) {
            console.warn(
              '[sentry] Source map upload failed:',
              error instanceof Error ? error.message : error,
            );
          },
        }),
    ].filter(Boolean),
    define: {
      __APP_RELEASE__: JSON.stringify(appRelease),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  };
});
