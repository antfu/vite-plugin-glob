export interface GlobOptions<Eager extends boolean> {
  /**
   * Custom query for the import url.
   */
  as?: string
  /**
   * Import as static or dynamic
   *
   * @default false
   */
  eager?: Eager
  /**
   * Import only the specific named export. Set to `default` to import the default export.
   */
  export?: string
}

export interface ParsedImportGlob {
  match: RegExpMatchArray
  index: number
  globs: string[]
  options: GlobOptions<boolean>
}

export interface PluginOptions {

}
