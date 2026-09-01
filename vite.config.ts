import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config for the Wardrobe Telegram Mini App.
// `base: './'` matters because Telegram opens the Mini App from a
// non-root path — absolute asset paths ("/assets/...") break there.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: true,
    port: 5173
  }
});
