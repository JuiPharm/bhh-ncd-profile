import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Generates relative asset paths for GitHub Pages static deployment
  build: {
    outDir: 'docs', // Output directly to docs directory
    emptyOutDir: false, // We keep .nojekyll and config.js
  },
});
