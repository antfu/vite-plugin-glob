import { dirname } from 'path'
import MagicString from 'magic-string'
import fg from 'fast-glob'
import { parse } from 'acorn'
import type { ArrayExpression, Literal } from 'estree'

const importGlobRE = /\bimport\.meta\.globNext(?:<\w+>)?\(([\s\S]*?)\)/g

export async function transform(code: string, id: string) {
  const matchs = Array.from(code.matchAll(importGlobRE))
  if (!matchs.length)
    return

  const s = new MagicString(code)

  for (const match of matchs) {
    const argumentString = `(${match[1]})`
    const ast = parse(argumentString, { ecmaVersion: 'latest' })
    // @ts-expect-error let me do it
    const body = ast.body[0].expression as Literal | ArrayExpression
    const globs: string[] = []
    if (body.type === 'ArrayExpression') {
      for (const element of body.elements) {
        if (element.type === 'Literal')
          globs.push(element.value as string)
      }
    }
    else {
      globs.push(body.value as string)
    }

    const files = await fg(globs, {
      dot: true,
      cwd: dirname(id),
    })
    const start = match.index!
    const end = start + match[0].length
    const replacement = `{${files.map(i => `'${i}': () => import('${i}')`).join(', ')}}`
    s.overwrite(start, end, replacement)
  }

  return {
    code: s.toString(),
    map: s.generateMap(),
  }
}
