interface ImportMeta {
  glob<T>(glob: string | string[], options?: import('./types').GlobOptions<false>): Record<string, () => Promise<T>>
  glob<T>(glob: string | string[], options: import('./types').GlobOptions<true>): Record<string, T>
  glob<T, Eager extends boolean>(
    glob: string | string[],
    options?: import('./types').GlobOptions<Eager>
  ): Eager extends true
    ? Record<string, T>
    : Record<string, () => Promise<T>>

  globEager<T>(
    glob: string | string[],
    options?: Omit<import('./types').GlobOptions<boolean>, 'eager'>
  ): Record<string, T>
}
