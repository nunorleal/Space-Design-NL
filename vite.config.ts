import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const certPath = process.env.SPACEPLAN_TLS_CERT;
const keyPath = process.env.SPACEPLAN_TLS_KEY;
if (Boolean(certPath) !== Boolean(keyPath)) {
  throw new Error('Defina SPACEPLAN_TLS_CERT e SPACEPLAN_TLS_KEY em conjunto.');
}
const https = certPath && keyPath ? { cert: readFileSync(certPath), key: readFileSync(keyPath) } : undefined;
const basePath = (process.env.SPACEPLAN_BASE_PATH ?? '').replace(/^\/+|\/+$/g, '');
const base = basePath ? `/${basePath}/` : '/';

export default defineConfig({
  base,
  server: { https },
  preview: { https },
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['icon.svg', 'apple-touch-icon.png'],
    manifest: {
      id: base, name: 'SpacePlan 3D', short_name: 'SpacePlan', lang: 'pt-PT',
      start_url: base, scope: base, display: 'standalone', background_color: '#f0f3f8', theme_color: '#121c30',
      icons: [192, 512].map(size => ({ src: `icon-${size}.png`, sizes: `${size}x${size}`, type: 'image/png' })),
    },
  })],
});
