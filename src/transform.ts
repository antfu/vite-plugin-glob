import { basename, dirname } from 'path'
import MagicString from 'magic-string'
import fg from 'fast-glob'
import type { TransformPluginContext } from 'rollup'
import type { PluginOptions } from '../types'
import { parseImportGlob } from './parse'
import { isCSSRequest } from './utils'

const importPrefix = '__vite_glob_next_'

export async function transform(
  code: string,
  id: string,
  parse: TransformPluginContext['parse'],
  options?: PluginOptions,
) {
  let matches = parseImportGlob(code, parse)

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

  const staticImports: string[] = []

  await Promise.all(matches.map(async({ globs, match, options, index }) => {
    const filename = basename(id)
    const files = (await fg(globs, {
      dot: true,
      cwd: dirname(id),
    }))
      .filter(file => file !== filename)
      .map(i => i.match(/^[.\/]/) ? i : `./${i}`)
      .sort()
    const start = match.index!
    const end = start + match[0].length
    const query = options.as ? `?${options.as}` : ''

    const objectProps: string[] = []

    files.forEach((file, i) => {
      let importPath = `${file}${query}`
      if (isCSSRequest(file))
        importPath = query ? `${importPath}&used` : `${importPath}?used`

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
  }))

  if (staticImports.length)
    s.prepend(`${staticImports.join('\n')}\n`)

  return {
    s,
    matches,
  }
}
