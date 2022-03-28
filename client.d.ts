interface ImportMeta {
  importGlob<T>(glob: string | string[], options?: import('./dist').GlobOptions<false>): Record<string, () => Promise<T>>
  importGlob<T>(glob: string | string[], options: import('./dist').GlobOptions<true>): Record<string, T>
  importGlob<T, Eager extends boolean>(
    glob: string | string[],
    options?: import('./dist').GlobOptions<Eager>
  ): Eager extends true
    ? Record<string, T>
    : Record<string, () => Promise<T>>
}
