import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    cssMinify: 'lightningcss',
    outDir: 'dist',
    assetsDir: 'assets',
    minify: true,
    assetsInlineLimit: 0, // Prevents inlining of assets
    sourcemap: false,
    emptyOutDir: true,
  },
  preview: {
    port: 5173,
    strictPort: true,
    host: true,
    headers: {
      'Cache-Control': 'no-store'
    }
  }
})
