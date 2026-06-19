import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Crucial for Electron to load assets correctly via file://
  server: {
    port: 5173,
    host: '127.0.0.1'
  }
});
