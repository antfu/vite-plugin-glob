import { defineConfig } from 'vite'
import GlobPlugin from '../src/index'

export default defineConfig({
  plugins: [
    GlobPlugin(),
  ],
  build: {
    target: 'esnext',
  },
  clearScreen: false,
})
