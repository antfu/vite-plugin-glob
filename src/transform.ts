import { dirname } from 'path'
import MagicString from 'magic-string'
import fg from 'fast-glob'

const importGlobRE = /\bimport\.meta\.globNext(?:<\w+>)?\((.*)\)/g

export async function transform(code: string, id: string) {
  const matchs = Array.from(code.matchAll(importGlobRE))
  if (!matchs.length)
    return

  const s = new MagicString(code)

  for (const match of matchs) {
    const glob = match[1].slice(1, -1)
    const files = await fg(glob, {
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
