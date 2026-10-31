import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration optimized for blazing fast mobile loading
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('dexie')) {
              return 'vendor-dexie';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            return 'vendor-others';
          }
        }
      }
    },
    chunkSizeWarningLimit: 800
  }
});
