import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// `vite preview` can serve a same-origin build (VITE_API_URL="") and forward API calls to the local
// backend, e.g. behind a temporary public tunnel. Requests are presented to the backend with an
// origin its CORS configuration already allows.
const API_TARGET = process.env.PREVIEW_API_TARGET || 'http://localhost:8081'
const apiProxy = {
  target: API_TARGET,
  changeOrigin: true,
  headers: { origin: 'http://localhost:5173' },
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, strictPort: true },
  preview: {
    allowedHosts: true,
    proxy: { '/api': apiProxy, '/actuator': apiProxy },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    css: false,
  },
})
