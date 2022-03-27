/// <reference types="vite/client" />

interface ImportMeta {
  globNext<T>(glob: string): Record<string, () => Promise<T>>
}
