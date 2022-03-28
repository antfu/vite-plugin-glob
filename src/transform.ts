import { dirname } from 'path'
import MagicString from 'magic-string'
import fg from 'fast-glob'
import type { TransformPluginContext } from 'rollup'
import { parseImportGlob } from './parse'

const importPrefix = '__vite_glob_next_'

export async function transform(
  code: string,
  id: string,
  parse: TransformPluginContext['parse'],
) {
  const matches = parseImportGlob(code, parse)
  if (!matches.length)
    return

  const s = new MagicString(code)

  const staticImports: string[] = []

  await Promise.all(matches.map(async({ globs, match, options, index }) => {
    const files = await fg(globs, {
      dot: true,
      cwd: dirname(id),
    })
    const start = match.index!
    const end = start + match[0].length
    const query = options.as ? `?${options.as}` : ''

    if (options.eager) {
      staticImports.push(
        ...files.map((file, i) => {
          const name = `${importPrefix}${index}_${i}`
          const expression = options.export
            ? `{ ${options.export} as ${name} }`
            : `* as ${name}`
          return `import ${expression} from '${file}${query}'`
        }),
      )
      const replacement = `{\n${files.map((file, i) => `'${file}': ${importPrefix}${index}_${i}`).join(',\n')}\n}`
      s.overwrite(start, end, replacement)
    }
    else {
      const objProps = files.map((i) => {
        let importStatement = `import('${i}${query}')`
        if (options.export)
          importStatement += `.then(m => m['${options.export}'])`
        return `'${i}': () => ${importStatement}`
      })
      const replacement = `{\n${objProps.join(',\n')}\n}`
      s.overwrite(start, end, replacement)
    }
  }))

  if (staticImports.length)
    s.prepend(`${staticImports.join('\n')}\n`)

  return {
    s,
    matches,
  }
}
