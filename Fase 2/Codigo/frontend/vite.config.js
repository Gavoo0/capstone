import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // En desarrollo, las llamadas a /api se redirigen al backend (puerto 4000).
  server: {
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
