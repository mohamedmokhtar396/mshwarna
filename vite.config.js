import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration with automatic CSS & Tailwind dark mode reload
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173
  }
});
