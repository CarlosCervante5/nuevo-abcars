import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Asegura que `.env` se lea siempre desde esta carpeta (abcars-imagen-studio).
  envDir: __dirname,
  server: {
    proxy: {
      '/gemini-api': {
        target: 'https://generativelanguage.googleapis.com',
        changeOrigin: true,
        secure: true,
        /** generateContent con imagen puede tardar varios minutos; evita cierre prematuro del proxy. */
        timeout: 600_000,
        proxyTimeout: 600_000,
        rewrite: (p) => p.replace(/^\/gemini-api/, ''),
      },
    },
  },
})
