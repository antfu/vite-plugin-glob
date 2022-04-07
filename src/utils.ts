import path from 'path'
import { scan } from 'micromatch'

const cssLangs = '\\.(css|less|sass|scss|styl|stylus|pcss|postcss)($|\\?)'
const cssLangRE = new RegExp(cssLangs)

export const isCSSRequest = (request: string): boolean =>
  cssLangRE.test(request)

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

export function toPosixPath(p: string) {
  return p.split('\\').join('/')
}

export function isVirtualModule(id: string) {
  // https://vitejs.dev/guide/api-plugin.html#virtual-modules-convention
  return id.startsWith('virtual:') || id.startsWith('\0') || !id.includes('/')
}
