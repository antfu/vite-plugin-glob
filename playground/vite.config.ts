import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import GlobPlugin from 'vite-plugin-glob'

export default defineConfig({
  resolve: {
    alias: {
      '~/': `${resolve(fileURLToPath(import.meta.url), '../src')}/`,
    },
  },
  plugins: [
    GlobPlugin({
      takeover: true,
    }),
  ],
  build: {
    target: 'esnext',
  },
  clearScreen: false,
  optimizeDeps: {
    entries: [],
  },
})
