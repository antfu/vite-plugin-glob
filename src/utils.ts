const cssLangs = '\\.(css|less|sass|scss|styl|stylus|pcss|postcss)($|\\?)'
const cssLangRE = new RegExp(cssLangs)

export const isCSSRequest = (request: string): boolean =>
  cssLangRE.test(request)

export function assert(condition: unknown): asserts condition {
  if (condition) {
    return
  }

  throw new Error(
    [
      "[vite-plugin-glob][Bug] You stumbled upon a bug in vite-plugin-glob's source code.",
      "Reach out at https://github.com/antfu/vite-plugin-glob/issues/new and include this error stack (the error stack is usually enough to fix the problem)."
    ].join(' ')
  )
}
