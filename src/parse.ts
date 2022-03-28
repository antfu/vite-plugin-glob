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
    const fnName = `import.meta.${type}`
    const argumentString = `[${match[2]}]`
    // @ts-expect-error let me do it
    const ast = parse(argumentString, { ecmaVersion: 'latest' }).body[0].expression as ArrayExpression

    if (ast.type !== 'ArrayExpression')
      throw new SyntaxError('Unknown syntax')

    if (ast.elements.length < 1 || ast.elements.length > 2)
      throw new Error(`Expected 1-2 arguments, but got ${ast.elements.length}`)

    // arg1
    const arg1 = ast.elements[0]!
    if (arg1.type !== 'Literal' && arg1.type !== 'ArrayExpression')
      throw new Error(`Could only use literals in ${fnName}`)

    const globs: string[] = []
    if (arg1.type === 'ArrayExpression') {
      for (const element of arg1.elements) {
        if (!element)
          continue
        if (element.type !== 'Literal')
          throw new Error(`Could only use literals in ${fnName}`)
        if (typeof element.value !== 'string')
          throw new Error(`Expected glob to be a string, but got "${typeof element.value}"`)

        globs.push(element.value)
      }
    }
    else {
      if (typeof arg1.value !== 'string')
        throw new Error(`Expected glob to be a string, but got "${typeof arg1.value}"`)

      globs.push(arg1.value)
    }

    // arg2
    const options: GeneralGlobOptions = {}
    const arg2 = ast.elements[1]
    if (arg2) {
      if (arg2.type !== 'ObjectExpression')
        throw new Error(`Expected the second argument of ${fnName} to be a object literal, but got "${arg2.type}"`)

      for (const property of arg2.properties) {
        if (property.type === 'SpreadElement' || property.key.type !== 'Identifier' || property.value.type !== 'Literal')
          throw new Error(`Could only use literals in ${fnName}`)

        const name = property.key.name as keyof GeneralGlobOptions
        if (!(name in knownOptions))
          throw new Error(`Unknown options ${name}`)

        const valueType = typeof property.value.value
        if (valueType === 'undefined')
          continue

        if (valueType !== knownOptions[name])
          throw new Error(`Expected the type of option "${name}" to be "${knownOptions[name]}", but got "${valueType}"`)

        options[name] = property.value.value as any
      }
    }

    if (options.as && forceDefaultAs.includes(options.as)) {
      if (options.export && options.export !== 'default')
        throw new Error(`Option "export" can only be "default" when "as" is "${options.as}", but got "${options.export}"`)
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
