/// <reference types="vite/client" />

interface ImportMeta {
  globNext<T>(glob: string | string[]): Record<string, () => Promise<T>>
}
