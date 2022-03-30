import path from 'path'
import { scan } from 'micromatch'

const cssLangs = '\\.(css|less|sass|scss|styl|stylus|pcss|postcss)($|\\?)'
const cssLangRE = new RegExp(cssLangs)

export const isCSSRequest = (request: string): boolean =>
  cssLangRE.test(request)

export function assert(condition: unknown): asserts condition {
  if (condition)
    return

  throw new Error(
    [
      '[vite-plugin-glob][Bug] You stumbled upon a bug in vite-plugin-glob\'s source code.',
      'Reach out at https://github.com/antfu/vite-plugin-glob/issues/new and include this error stack (the error stack is usually enough to fix the problem).',
    ].join(' '),
  )
}

export function getCommonBase(globsResolved: string[]): null | string {
  const bases = globsResolved.filter(g => !g.startsWith('!')).map((glob) => {
    let { base } = scan(glob)
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
