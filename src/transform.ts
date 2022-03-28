import { dirname } from 'path'
import MagicString from 'magic-string'
import fg from 'fast-glob'
import type { ArrayExpression, Literal, ObjectExpression } from 'estree'
import type { TransformPluginContext } from 'rollup'
import type { GlobOptions, ParsedImportGlob } from './types'

const importGlobRE = /\bimport\.meta\.importGlob(?:<\w+>)?\(([\s\S]*?)\)/g
const importPrefix = '__vite_glob_next_'

export function parseImportGlob(
  code: string,
  parse: TransformPluginContext['parse'],
): ParsedImportGlob[] {
  const matchs = Array.from(code.matchAll(importGlobRE))

  return matchs.map((match, index) => {
    const argumentString = `[${match[1]}]`
    // @ts-expect-error let me do it
    const ast = parse(argumentString, { ecmaVersion: 'latest' }).body[0].expression as ArrayExpression

    // TODO: runtime warning
    // arg1
    const arg1 = ast.elements[0] as Literal | ArrayExpression
    const globs: string[] = []
    if (arg1.type === 'ArrayExpression') {
      for (const element of arg1.elements) {
        if (element?.type === 'Literal')
          globs.push(element.value as string)
      }
    }
    else {
      globs.push(arg1.value as string)
    }

    // arg2
    const options: GlobOptions<boolean> = {}
    const arg2 = ast.elements[1] as ObjectExpression | undefined
    if (arg2) {
      for (const property of arg2.properties) {
        // @ts-expect-error let me do it
        options[property.key.name] = property.value.value
      }
    }
    return {
      match,
      index,
      globs,
      options,
    }
  })
}

export async function transform(
  code: string,
  id: string,
  parse: TransformPluginContext['parse'],
) {
  const matches = parseImportGlob(code, parse)
  if (!matches.length)
    return

  const s = new MagicString(code)

  await Promise.all(matches.map(async({ globs, match, options, index }) => {
    const files = await fg(globs, {
      dot: true,
      cwd: dirname(id),
    })
    const start = match.index!
    const end = start + match[0].length
    const query = options.as ? `?${options.as}` : ''

    if (options.eager) {
      const imports = files.map((file, i) => `import * as ${importPrefix}${index}_${i} from '${file}${query}'`).join('\n')
      s.prepend(`${imports}\n`)
      const replacement = `{\n${files.map((file, i) => `'${file}': ${importPrefix}${index}_${i}`).join(',\n')}\n}`
      s.overwrite(start, end, replacement)
    }
    else {
      const replacement = `{\n${files.map(i => `'${i}': () => import('${i}${query}')`).join(',\n')}\n}`
      s.overwrite(start, end, replacement)
    }
  }))

  return {
    s,
    matches,
  }
}
