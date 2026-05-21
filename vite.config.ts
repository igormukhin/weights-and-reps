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
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('vuetify')) {
              return 'vendor-vuetify';
            }
            if (id.includes('firebase/firestore') || id.includes('@firebase/firestore')) {
              return 'vendor-firebase-db';
            }
            if (
              id.includes('firebase/app') ||
              id.includes('firebase/auth') ||
              id.includes('@firebase/auth') ||
              id.includes('@firebase/app') ||
              id.includes('@firebase/util')
            ) {
              return 'vendor-firebase-core';
            }
            if (id.includes('vue') || id.includes('pinia')) {
              return 'vendor-vue';
            }
          }
        },
      },
    },
  },
  test: {
    environment: 'node',
    exclude: ['e2e/**', 'node_modules/**'],
  },
})
