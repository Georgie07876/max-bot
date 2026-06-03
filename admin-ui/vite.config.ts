import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  base: '/admin/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/admin/login': 'http://localhost:3000',
      '/admin/logout': 'http://localhost:3000',
      '/admin/api': 'http://localhost:3000',
    },
  },
});
