/* eslint-disable import/no-unresolved */
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths'; // optional

export default defineConfig({
  define: {
    'process.env': {
      // This makes process.env available
      NODE_ENV: JSON.stringify(process.env.NODE_ENV),
    },
  },
  plugins: [react(), tsconfigPaths()],
  optimizeDeps: {
    include: ['react-window'],
  },
  server: {
    allowedHosts: process.env.VITE_ALLOWED_HOSTS
      ? process.env.VITE_ALLOWED_HOSTS.split(',')
      : [''],
  },
});
