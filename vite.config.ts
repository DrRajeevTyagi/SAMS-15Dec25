import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/ScholasticAI-SAMS/', // CRITICAL: GitHub Pages base path
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  define: {
    // Safety shim for GenAI SDK if it relies on process.env in some contexts
    'process.env': {}
  }
})