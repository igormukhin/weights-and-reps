import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
  ],
  server: {
    host: '0.0.0.0',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-vue':      ['vue', 'vue-router', 'pinia'],
          'vendor-vuetify':  ['vuetify'],
          'vendor-firebase-core': ['firebase/app', 'firebase/auth'],
          'vendor-firebase-db':   ['firebase/firestore'],
        },
      },
    },
  },
  test: {
    environment: 'node',
    exclude: ['e2e/**', 'node_modules/**'],
  },
})
