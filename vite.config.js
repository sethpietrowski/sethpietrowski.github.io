import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // base: process.env.NODE_ENV === 'production' ? '/sethpietrowski.github.io' : '/',
  base: '/',
  plugins: [react()],
  build: {
    outDir: 'docs',
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true
  },
  optimizeDeps: {
    include: ['three']
  }
})
