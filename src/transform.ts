import { posix } from 'path'
import MagicString from 'magic-string'
import fg from 'fast-glob'
import { stringifyQuery } from 'ufo'
import type { PluginOptions } from '../types'
import { parseImportGlob } from './parse'
import { isCSSRequest } from './utils'

const importPrefix = '__vite_glob_next_'

const { basename, dirname, relative } = posix

export async function transform(
  code: string,
  id: string,
  root: string,
  options?: PluginOptions,
) {
  const filename = basename(id)
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
    matches.map(async({ absoluteGlobs, options, index, start, end }) => {
      const files = (await fg(absoluteGlobs, { dot: true, absolute: true, cwd: root }))
        .map((i) => {
          const path = relative(dir, i)
          if (path === filename)
            return undefined!
          if ('./'.includes(path[0]))
            return path
          return `./${path}`
        })
        .filter(Boolean)
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

      files.forEach((file, i) => {
        let importPath = file

        if (isCSSRequest(file))
          query = query ? `${query}&used` : '?used'

        if (options.queryRestoreFileExtension) {
          const fileExtension = basename(file).split('.').slice(-1)[0]
          if (fileExtension)
            query = `${query ? `${query}&` : '?'}lang.${fileExtension}`
        }

        importPath = `${importPath}${query}`

        if (options.eager) {
          const variableName = `${importPrefix}${index}_${i}`
          const expression = options.export
            ? `{ ${options.export} as ${variableName} }`
            : `* as ${variableName}`
          staticImports.push(`import ${expression} from ${JSON.stringify(importPath)}`)
          objectProps.push(`${JSON.stringify(file)}: ${variableName}`)
        }
        else {
          let importStatement = `import(${JSON.stringify(importPath)})`
          if (options.export)
            importStatement += `.then(m => m[${JSON.stringify(options.export)}])`
          objectProps.push(`${JSON.stringify(file)}: () => ${importStatement}`)
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
