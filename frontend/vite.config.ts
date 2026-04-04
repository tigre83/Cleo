import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  define: {
    'process.env': process.env,
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['@supabase/supabase-js'],
  },
})
# cache bust Sat Apr  4 18:39:04 -05 2026
