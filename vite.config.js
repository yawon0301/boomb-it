import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// localStorage 우선 MVP. Supabase 전환 시 src/lib/store.js 만 교체하면 됩니다.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, open: true },
})
