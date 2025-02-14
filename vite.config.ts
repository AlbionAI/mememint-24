
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  server: {
    port: 8080,
    host: "::"
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      buffer: 'buffer',
    },
  },
  define: {
    global: {},
    'process.env': {},
  },
  optimizeDeps: {
    include: ['buffer'],
    force: true,
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  build: {
    rollupOptions: {
      external: ['buffer'],
    },
    commonjsOptions: {
      include: [/buffer/, /node_modules/],
      transformMixedEsModules: true
    },
  },
});
