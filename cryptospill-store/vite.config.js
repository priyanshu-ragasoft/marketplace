import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const rawTarget = env.VITE_STORE_API_BASE_URL || env.VITE_API_BASE_URL || 'https://apis.cryptospill.io'
  const target = rawTarget.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: true,
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          secure: false,
        }
      }
    }
  }
})
