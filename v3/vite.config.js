import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression2';

export default defineConfig({
  plugins: [react(), compression({ algorithms: ['gzip', 'brotliCompress'] })],
  build: {
    sourcemap: false,
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three') || id.includes('node_modules/@react-three') || id.includes('node_modules/postprocessing')) {
            return 'three-vendor';
          }
          if (id.includes('node_modules/gsap')) {
            return 'gsap-vendor';
          }
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/zustand')) {
            return 'react-vendor';
          }
        },
      },
    },
  },
});
