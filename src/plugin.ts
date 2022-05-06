import path, { posix } from 'path'
import type { ModuleNode, Plugin, ResolvedConfig, ViteDevServer } from 'vite'
import mm from 'micromatch'
import type { ArrayExpression, CallExpression, Literal, Node } from 'estree'
import { parseExpressionAt } from 'acorn'
import MagicString from 'magic-string'
import fg from 'fast-glob'
import { stringifyQuery } from 'ufo'
import type { GeneralGlobOptions, ParsedImportGlob, PluginOptions } from '../types'

const cssLangs = '\\.(css|less|sass|scss|styl|stylus|pcss|postcss)($|\\?)'
const cssLangRE = new RegExp(cssLangs)

export function importGlobPlugin(options: PluginOptions = {}): Plugin {
  let server: ViteDevServer | undefined
  let config: ResolvedConfig
  const map = new Map<string, string[][]>()

  function updateMap(id: string, info: ParsedImportGlob[]) {
    const allGlobs = info.map(i => i.globsResolved)
    map.set(id, allGlobs)
    // add those allGlobs to the watcher
    server?.watcher.add(allGlobs.flatMap(i => i.filter(i => i[0] !== '!')))
  }

  function getAffectedModules(file: string) {
    const modules: ModuleNode[] = []
    for (const [id, allGlobs] of map) {
      if (allGlobs.some(glob => mm.isMatch(file, glob)))
        modules.push(...(server?.moduleGraph.getModulesByFile(id) || []))
    }
    return modules
  }

  return {
    name: 'vite-plugin-glob',
    config() {
      return {
        server: {
          watch: {
            disableGlobbing: false,
          },
        },
      }
    },
    configResolved(_config) {
      config = _config
    },
    buildStart() {
      map.clear()
    },
    configureServer(_server) {
      server = _server
      const handleFileAddUnlink = (file: string) => {
        const modules = getAffectedModules(file)
        _server.ws.send({
          type: 'update',
          updates: modules.map((mod) => {
            _server.moduleGraph.invalidateModule(mod)
            return {
              acceptedPath: mod.id!,
              path: mod.id!,
              timestamp: Date.now(),
              type: 'js-update',
            }
          }),
        })
      }
      server.watcher.on('unlink', handleFileAddUnlink)
      server.watcher.on('add', handleFileAddUnlink)
    },
    async transform(code, id) {
      const result = await transform(
        code,
        id,
        config.root,
        im => this.resolve(im, id).then(i => i?.id || im),
        options,
      )
      if (result) {
        updateMap(id, result.matches)
        return {
          code: result.s.toString(),
          map: result.s.generateMap(),
        }
      }
    },
  }
}

const importGlobRE = /\bimport\.meta\.(importGlob|glob|globEager|globEagerDefault)(?:<\w+>)?\s*\(/g

const knownOptions = {
  as: 'string',
  eager: 'boolean',
  export: 'string',
  exhaustive: 'boolean',
} as const

const forceDefaultAs = ['raw', 'url']

export async function parseImportGlob(
  code: string,
  dir: string | null,
  root: string,
  resolveId: (id: string) => string | Promise<string>,
): Promise<ParsedImportGlob[]> {
  const matchs = Array.from(code.matchAll(importGlobRE))

  const tasks = matchs.map(async (match, index) => {
    const type = match[1]
    const start = match.index!

    const err = (msg: string) => {
      const e = new Error(`Invalid glob import syntax: ${msg}`)
      ;(e as any).pos = start
      return e
    }

    let ast: CallExpression

    try {
      ast = parseExpressionAt(
        code,
        start,
        {
          ecmaVersion: 'latest',
          sourceType: 'module',
          ranges: true,
        },
      ) as any
    }
    catch (e) {
      const _e = e as any
      if (_e.message && _e.message.startsWith('Unterminated string constant'))
        return undefined!
      throw _e
    }

    if (ast.type !== 'CallExpression')
      throw err(`Expect CallExpression, got ${ast.type}`)

    if (ast.arguments.length < 1 || ast.arguments.length > 2)
      throw err(`Expected 1-2 arguments, but got ${ast.arguments.length}`)

    const arg1 = ast.arguments[0] as ArrayExpression | Literal
    const arg2 = ast.arguments[1] as Node | undefined

    const globs: string[] = []
    if (arg1.type === 'ArrayExpression') {
      for (const element of arg1.elements) {
        if (!element)
          continue
        if (element.type !== 'Literal')
          throw err('Could only use literals')
        if (typeof element.value !== 'string')
          throw err(`Expected glob to be a string, but got "${typeof element.value}"`)

        globs.push(element.value)
      }
    }
    else if (arg1.type === 'Literal') {
      if (typeof arg1.value !== 'string')
        throw err(`Expected glob to be a string, but got "${typeof arg1.value}"`)
      globs.push(arg1.value)
    }
    else {
      throw err('Could only use literals')
    }

    // if (!globs.every(i => i.match(/^[.\/!]/)))
    //   throw err('pattern must start with "." or "/" (relative to project root) or alias path')

    // arg2
    const options: GeneralGlobOptions = {}
    if (arg2) {
      if (arg2.type !== 'ObjectExpression')
        throw err(`Expected the second argument o to be a object literal, but got "${arg2.type}"`)

      for (const property of arg2.properties) {
        if (property.type === 'SpreadElement' || property.key.type !== 'Identifier')
          throw err('Could only use literals')

        const name = property.key.name as keyof GeneralGlobOptions

        if (name === 'query') {
          if (property.value.type === 'ObjectExpression') {
            const data: Record<string, string> = {}
            for (const prop of property.value.properties) {
              if (prop.type === 'SpreadElement' || prop.key.type !== 'Identifier' || prop.value.type !== 'Literal')
                throw err('Could only use literals')
              data[prop.key.name] = prop.value.value as any
            }
            options.query = data
          }
          else if (property.value.type === 'Literal') {
            if (typeof property.value.value !== 'string')
              throw err(`Expected query to be a string, but got "${typeof property.value.value}"`)
            options.query = property.value.value
          }
          else {
            throw err('Could only use literals')
          }
          continue
        }

        if (!(name in knownOptions))
          throw err(`Unknown options ${name}`)

        if (property.value.type !== 'Literal')
          throw err('Could only use literals')

        const valueType = typeof property.value.value
        if (valueType === 'undefined')
          continue

        if (valueType !== knownOptions[name])
          throw err(`Expected the type of option "${name}" to be "${knownOptions[name]}", but got "${valueType}"`)
        options[name] = property.value.value as any
      }
    }

    if (options.as && forceDefaultAs.includes(options.as)) {
      if (options.export && options.export !== 'default')
        throw err(`Option "export" can only be "default" when "as" is "${options.as}", but got "${options.export}"`)
      options.export = 'default'
    }

    if (options.as && options.query)
      throw err('Options "as" and "query" cannot be used together')

    if (options.as)
      options.query = options.as

    const end = ast.range![1]

    const globsResolved = await Promise.all(globs.map(glob => toAbsoluteGlob(glob, root, dir ?? root, resolveId)))
    const isRelative = globs.every(i => '.!'.includes(i[0]))

    return {
      match,
      index,
      globs,
      globsResolved,
      isRelative,
      options,
      type,
      start,
      end,
    }
  })

  return (await Promise.all(tasks))
    .filter(Boolean)
}

const importPrefix = '__vite_glob_next_'

const { basename, dirname, relative, join } = posix

export async function transform(
  code: string,
  id: string,
  root: string,
  resolveId: (id: string) => Promise<string> | string,
  options?: PluginOptions,
) {
  id = toPosixPath(id)
  root = toPosixPath(root)
  const dir = isVirtualModule(id) ? null : dirname(id)
  let matches = await parseImportGlob(code, dir, root, resolveId)

  if (options?.takeover) {
    matches.forEach((i) => {
      if (i.type === 'globEager')
        i.options.eager = true
      if (i.type === 'globEagerDefault') {
        i.options.eager = true
        i.options.export = 'default'
      }
    })
  }
  else {
    matches = matches.filter(i => i.type === 'importGlob')
  }

  if (!matches.length)
    return

  const s = new MagicString(code)

  const staticImports = (await Promise.all(
    matches.map(async ({ globsResolved, isRelative, options, index, start, end }) => {
      const cwd = getCommonBase(globsResolved) ?? root
      const files = (await fg(globsResolved, {
        cwd,
        absolute: true,
        dot: !!options.exhaustive,
        ignore: options.exhaustive
          ? []
          : [join(cwd, '**/node_modules/**')],
      }))
        .filter(file => file !== id)
        .sort()

      const objectProps: string[] = []
      const staticImports: string[] = []

      let query = !options.query
        ? ''
        : typeof options.query === 'string'
          ? options.query
          : stringifyQuery(options.query as any)

      if (query && !query.startsWith('?'))
        query = `?${query}`

      const resolvePaths = (file: string) => {
        if (!dir) {
          if (isRelative)
            throw new Error('In virtual modules, all globs must start with \'/\'')
          const filePath = `/${relative(root, file)}`
          return { filePath, importPath: filePath }
        }

        let importPath = relative(dir, file)
        if (!importPath.startsWith('.'))
          importPath = `./${importPath}`

        let filePath: string
        if (isRelative) {
          filePath = importPath
        }
        else {
          filePath = relative(root, file)
          if (!filePath.startsWith('.'))
            filePath = `/${filePath}`
        }

        return { filePath, importPath }
      }

      files.forEach((file, i) => {
        const paths = resolvePaths(file)
        const filePath = paths.filePath
        let importPath = paths.importPath
        let importQuery = query

        if (isCSSRequest(file))
          importQuery = importQuery ? `${importQuery}&used` : '?used'

        if (importQuery && importQuery !== '?raw') {
          const fileExtension = basename(file).split('.').slice(-1)[0]
          if (fileExtension)
            importQuery = `${importQuery}&lang.${fileExtension}`
        }

        importPath = `${importPath}${importQuery}`

        if (options.eager) {
          const variableName = `${importPrefix}${index}_${i}`
          const expression = options.export
            ? `{ ${options.export} as ${variableName} }`
            : `* as ${variableName}`
          staticImports.push(`import ${expression} from ${JSON.stringify(importPath)}`)
          objectProps.push(`${JSON.stringify(filePath)}: ${variableName}`)
        }
        else {
          let importStatement = `import(${JSON.stringify(importPath)})`
          if (options.export)
            importStatement += `.then(m => m[${JSON.stringify(options.export)}])`
          objectProps.push(`${JSON.stringify(filePath)}: () => ${importStatement}`)
        }
      })

      const replacement = `{\n${objectProps.join(',\n')}\n}`
      s.overwrite(start, end, replacement)

      return staticImports
    }),
  )).flat()

  if (staticImports.length)
    s.prepend(`${staticImports.join('\n')}\n`)

  return {
    s,
    matches,
  }
}

export async function toAbsoluteGlob(
  glob: string,
  root: string,
  dirname: string,
  resolveId: (id: string) => string | Promise<string>,
): Promise<string> {
  let pre = ''
  if (glob.startsWith('!')) {
    pre = '!'
    glob = glob.slice(1)
  }

  if (glob.startsWith('/'))
    return pre + posix.join(root, glob.slice(1))
  if (glob.startsWith('./'))
    return pre + posix.join(dirname, glob.slice(2))
  if (glob.startsWith('../'))
    return pre + posix.join(dirname, glob)
  if (glob.startsWith('**'))
    return pre + glob

  const resolved = await resolveId(glob)
  if (resolved.startsWith('/'))
    return pre + resolved

  throw new Error(`Invalid glob: ${glob}. It must starts with '/' or './'`)
}

export function isCSSRequest(request: string): boolean {
  return cssLangRE.test(request)
}

export function getCommonBase(globsResolved: string[]): null | string {
  const bases = globsResolved.filter(g => !g.startsWith('!')).map((glob) => {
    let { base } = mm.scan(glob)
    // `scan('a/foo.js')` returns `base: 'a/foo.js'`
    if (path.posix.basename(base).includes('.'))
      base = path.posix.dirname(base)

    return base
  })

  if (!bases.length)
    return null

  let commonAncestor = ''
  const dirS = bases[0].split('/')
  for (let i = 0; i < dirS.length; i++) {
    const candidate = dirS.slice(0, i + 1).join('/')
    if (bases.every(base => base.startsWith(candidate)))
      commonAncestor = candidate
    else
      break
  }
  if (!commonAncestor)
    commonAncestor = '/'

  return commonAncestor
}

export function toPosixPath(p: string) {
  return p.split('\\').join('/')
}

export function isVirtualModule(id: string) {
  // https://vitejs.dev/guide/api-plugin.html#virtual-modules-convention
  return id.startsWith('virtual:') || id.startsWith('\0') || !id.includes('/')
}

