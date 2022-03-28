export interface GlobOptions<Eager extends boolean> {
  as?: string
  eager?: Eager
}

export interface ParsedImportGlob {
  match: RegExpMatchArray
  index: number
  globs: string[]
  options: GlobOptions<boolean>
}

export interface PluginOptions {

}
