export interface GlobOptions<Eager extends boolean, AsType extends string> {
  /**
   * Import type for the import url.
   */
  as?: AsType
  /**
   * Import as static or dynamic
   *
   * @default false
   */
  eager?: Eager
  /**
   * Import only the specific named export. Set to `default` to import the default export.
   */
  import?: string
  /**
   * Custom queries
   */
  query?: string | Record<string, string | number | boolean>
  /**
   * Search files also inside `node_modules/` and hidden directories (e.g. `.git/`). This might have impact on performance.
   *
   * @default false
   */
  exhaustive?: boolean
}

export type GeneralGlobOptions = GlobOptions<boolean, string>

export interface ParsedImportGlob {
  match: RegExpMatchArray
  index: number
  globs: string[]
  globsResolved: string[]
  isRelative: boolean
  options: GeneralGlobOptions
  type: string
  start: number
  end: number
}

export interface KnownAsType {
  raw: string
  url: string
  worker: Worker
}

export interface PluginOptions {
  /**
   * Take over the default import.meta.glob in Vite
   *
   * @default false
   */
  takeover?: boolean

  /**
   * Append fake `&lang.(ext)` when queries are specified, to preseve the file extension for following plugins to process.
   *
   * @experimental
   * @default false
   */
  restoreQueryExtension?: boolean
}

type isTrue<T> = T extends true ? true : false

export interface GlobFunction {
  /**
   * 1. No generic provided, infer the type from `eager` and `as`
   */
  <Eager extends boolean, As extends string, T = As extends keyof KnownAsType ? KnownAsType[As] : unknown>(
    glob: string | string[],
    options?: GlobOptions<Eager, As>
  ): isTrue<Eager> extends true
    ? Record<string, T>
    : Record<string, () => Promise<T>>
  /**
   * 2. Module generic provided, infer the type from `eager: false`
   */
  <M>(glob: string | string[], options?: GlobOptions<false, string>): Record<string, () => Promise<M>>
  /**
   * 3. Module generic provided, infer the type from `eager: true`
   */
  <M>(glob: string | string[], options: GlobOptions<true, string>): Record<string, M>
}

export interface GlobEagerFunction {
  /**
   * 1. No generic provided, infer the type from `as`
   */
  <As extends string, T = As extends keyof KnownAsType ? KnownAsType[As] : unknown>(
    glob: string | string[],
    options?: Omit<GlobOptions<boolean, As>, 'eager'>
  ): Record<string, T>
  /**
   * 2. Module generic provided
   */
  <M>(
    glob: string | string[],
    options?: Omit<GlobOptions<boolean, string>, 'eager'>
  ): Record<string, M>
}

// type test
// const recordPromise = import.meta.glob('./modules/*.ts')
// const recordUnknown = import.meta.glob('./modules/*.ts', { eager: true })
// const recordString = import.meta.glob('./modules/*.ts', { eager: true, as: 'raw' })
// const recordPromiseString = import.meta.glob('./modules/*.ts', { as: 'raw' })
// const recordPromiseNumber = import.meta.glob<number>('./modules/*.ts', { as: 'raw' })
// const recordNumber = import.meta.glob<number>('./modules/*.ts', { eager: true })
// const recordPromiseNumber2 = import.meta.glob<number>('./modules/*.ts', { eager: false })
