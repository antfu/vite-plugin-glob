import type { ArrayExpression } from 'estree'
import type { TransformPluginContext } from 'rollup'
import type { GeneralGlobOptions, ParsedImportGlob } from '../types'

const importGlobRE = /\bimport\.meta\.(importGlob|glob|globEager|globEagerDefault)(?:<\w+>)?\s*\(([\s\S]*?)\)/g

const knownOptions = {
  as: 'string',
  eager: 'boolean',
  export: 'string',
}

const forceDefaultAs = ['raw', 'url']

export function parseImportGlob(
  code: string,
  parse: TransformPluginContext['parse'],
): ParsedImportGlob[] {
  const matchs = Array.from(code.matchAll(importGlobRE))

  return matchs.map((match, index) => {
    const type = match[1]
    const argumentString = `[${match[2]}]`

    const err = (msg: string) => {
      const e = new Error(`Invalid glob import syntax: ${msg}`)
      ;(e as any).pos = match.index
      return e
    }

    let ast: ArrayExpression = undefined!

    try {
      // @ts-expect-error let me do it
      ast = parse(argumentString, { ecmaVersion: 'latest' }).body[0].expression as ArrayExpression
    }
    catch (e) {
      (e as any).pos = match.index
      throw e
    }

    if (ast.type !== 'ArrayExpression')
      throw err('Unknown syntax')

    if (ast.elements.length < 1 || ast.elements.length > 2)
      throw err(`Expected 1-2 arguments, but got ${ast.elements.length}`)

    // arg1
    const arg1 = ast.elements[0]!
    if (arg1.type !== 'Literal' && arg1.type !== 'ArrayExpression')
      throw err('Could only use literals')

    const globs: string[] = []
    if (arg1.type === 'ArrayExpression') {
      for (const element of arg1.elements) {
        if (!element)
          continue
        if (element.type !== 'Literal')
          throw err('Could only use literals')
        if (typeof element.value !== 'string')
          throw err(`Expected glob to be a string, but got "${typeof element.value}"`)

        globs.push(element.value)
      }
    }
    else {
      if (typeof arg1.value !== 'string')
        throw err(`Expected glob to be a string, but got "${typeof arg1.value}"`)

      globs.push(arg1.value)
    }

    if (!globs.every(i => i.match(/^[.\/!]/)))
      throw err('pattern must start with "." or "/" (relative to project root) or alias path')

    // arg2
    const options: GeneralGlobOptions = {}
    const arg2 = ast.elements[1]
    if (arg2) {
      if (arg2.type !== 'ObjectExpression')
        throw err(`Expected the second argument o to be a object literal, but got "${arg2.type}"`)

      for (const property of arg2.properties) {
        if (property.type === 'SpreadElement' || property.key.type !== 'Identifier' || property.value.type !== 'Literal')
          throw err('Could only use literals')

        const name = property.key.name as keyof GeneralGlobOptions
        if (!(name in knownOptions))
          throw err(`Unknown options ${name}`)

        const valueType = typeof property.value.value
        if (valueType === 'undefined')
          continue

        if (valueType !== knownOptions[name])
          throw err(`Expected the type of option "${name}" to be "${knownOptions[name]}", but got "${valueType}"`)

        options[name] = property.value.value as any
      }
    }

    if (options.as && forceDefaultAs.includes(options.as)) {
      if (options.export && options.export !== 'default')
        throw err(`Option "export" can only be "default" when "as" is "${options.as}", but got "${options.export}"`)
      options.export = 'default'
    }

    return {
      match,
      index,
      globs,
      options,
      type,
    }
  })
}
