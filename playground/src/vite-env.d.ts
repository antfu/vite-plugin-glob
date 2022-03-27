/// <reference types="vite/client" />

interface ImportMeta {
  myGlob<T>(glob: string | string[], options?: GlobOptions<false>): Record<string, () => Promise<T>>
  myGlob<T>(glob: string | string[], options: GlobOptions<true>): Record<string, T>
  myGlob<T, Eager extends boolean>(
    glob: string | string[],
    options?: GlobOptions<Eager>
  ): Eager extends true
    ? Record<string, T>
    : Record<string, () => Promise<T>>
}

interface GlobOptions<Eager extends boolean> {
  as?: string
  eager?: Eager
}
