import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { sightlineAuthPlugin } from './server/vitePluginAuth.ts';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    sightlineAuthPlugin(),
    tailwindcss(),
    react(),
  ],
});
