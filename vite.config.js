import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8888,
    open: true
  },
  base: '/water-level-wave-shader/',
  build: {
    target: 'esnext' // Allows top-level await
  }
})
