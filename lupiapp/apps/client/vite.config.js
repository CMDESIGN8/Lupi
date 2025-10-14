import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Config para Render
export default defineConfig({
  plugins: [react()],
  server: {
    port: process.env.PORT || 5173,
    host: true
  },
  preview: {
    port: process.env.PORT || 4173,
    host: true
  },
  base: './' // importante para rutas relativas correctas
})
