import { basename, posix } from 'path'
import MagicString from 'magic-string'
import fg from 'fast-glob'
import { stringifyQuery } from 'ufo'
import type { PluginOptions } from '../types'
import { parseImportGlob } from './parse'
import { assert, getCommonBase, isCSSRequest } from './utils'

const importPrefix = '__vite_glob_next_'

const { dirname, relative, join } = posix

export async function transform(
  code: string,
  id: string,
  root: string,
  resolveId: (id: string) => Promise<string> | string,
  options?: PluginOptions,
) {
  const dir = dirname(id)
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
    matches.map(async({ globsResolved, isRelative, options, index, start, end }) => {
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
        assert(file.startsWith('/'))

        let importPath = relative(dir, file)
        assert(!importPath.startsWith('/'))
        if (!importPath.startsWith('.'))
          importPath = `./${importPath}`

        let filePath: string
        if (isRelative) {
          filePath = importPath
        }
        else {
          filePath = relative(root, file)
          assert(!filePath.startsWith('/'))
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

        importPath = `${importPath}${query}`
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
