import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  base: '/flowstate-finance/',
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': resolve(new URL('./src', import.meta.url).pathname),
    },
  },
});