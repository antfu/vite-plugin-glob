interface ImportMeta {
  importGlob<T>(glob: string | string[], options?: import('./types').GlobOptions<false>): Record<string, () => Promise<T>>
  importGlob<T>(glob: string | string[], options: import('./types').GlobOptions<true>): Record<string, T>
  importGlob<T, Eager extends boolean>(
    glob: string | string[],
    options?: import('./types').GlobOptions<Eager>
  ): Eager extends true
    ? Record<string, T>
    : Record<string, () => Promise<T>>
}
