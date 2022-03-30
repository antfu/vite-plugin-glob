import { resolve } from 'path'
import { defineConfig } from 'vite'
import GlobPlugin from '../src'

export default defineConfig({
  resolve: {
    alias: {
      '~/': `${resolve(__dirname, 'src')}/`,
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
