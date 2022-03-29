import { posix } from 'path'
import MagicString from 'magic-string'
import fg from 'fast-glob'
import { stringifyQuery } from 'ufo'
import type { PluginOptions } from '../types'
import { parseImportGlob } from './parse'
import { assert, isCSSRequest } from './utils'

const importPrefix = '__vite_glob_next_'

const { dirname, relative } = posix

export async function transform(
  code: string,
  id: string,
  root: string,
  options?: PluginOptions,
) {
  const dir = dirname(id)
  let matches = parseImportGlob(code, dir, root)

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
    matches.map(async({ globsResolved, options, index, start, end }) => {
      const files = (await fg(globsResolved.map(g => g.globResolved), { dot: true, absolute: true, cwd: root }))
        .filter((file) => file!==id)
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

      const filePathsRelativeToRoot =
        options.filePathsRelativeToRoot ?? globsResolved.some((g) => g.globOriginal.startsWith('/'))
      const resolvePaths = (file: string) => {
        assert(file.startsWith('/'))

        let importPath = relative(dir, file)
        assert(!importPath.startsWith('/'))
        if (!importPath.startsWith('.')) {
          importPath = `./${importPath}`
        }

        let filePath: string
        if (!filePathsRelativeToRoot) {
          filePath = importPath
        } else {
          filePath = relative(root, file)
          assert(!filePath.startsWith('/'))
          if (!filePath.startsWith('.')) {
            filePath = `/${filePath}`
          }
        }

        return { filePath, importPath }
      }

      files.forEach((file, i) => {
        let { filePath, importPath } = resolvePaths(file)

        importPath = `${importPath}${query}`
        if (isCSSRequest(file))
          importPath = query ? `${importPath}&used` : `${importPath}?used`

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
