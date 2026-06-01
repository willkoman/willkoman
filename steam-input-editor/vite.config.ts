import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

// Deploy target: willko.dev/padsmith/
//
// Vite `base` controls the URL prefix in the built HTML for all asset
// references (script src, link href). React Router reads `BASE_URL` from
// `import.meta.env` and uses it as the `basename`, so a request to
// `/padsmith/editor` resolves to the `/editor` route.
//
// Override at build time:  `VITE_BASE=/foo/ npm run build`
// Dev server still mounts at `/` (vite serves the spa from the repo root)
// unless you also pass VITE_BASE; routes work either way because the router
// reads `import.meta.env.BASE_URL` at runtime.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.VITE_BASE ?? '/padsmith/';
  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        // navigateFallback must be served from inside the app's base path
        // or the service worker routes home requests to the wrong place.
        workbox: {
          cleanupOutdatedCaches: true,
          navigateFallback: `${base}index.html`,
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts',
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
          ],
        },
        manifest: {
          name: 'Padsmith',
          short_name: 'Padsmith',
          description: 'Visual editor for Steam Input controller schemas',
          theme_color: '#0c0a08',
          background_color: '#0c0a08',
          display: 'standalone',
          scope: base,
          start_url: base,
          icons: [
            { src: `${base}icon-192.png`, sizes: '192x192', type: 'image/png' },
            { src: `${base}icon-512.png`, sizes: '512x512', type: 'image/png' },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      host: true, // listen on 0.0.0.0 so a Steam Deck on the same LAN can reach the dev server
    },
    test: {
      globals: true,
      environment: 'node',
      include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    },
  };
});
