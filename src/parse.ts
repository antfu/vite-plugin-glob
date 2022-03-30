import type { ArrayExpression, Literal, Node, SequenceExpression } from 'estree'
import { parseExpressionAt } from 'acorn'
import type { GeneralGlobOptions, ParsedImportGlob } from '../types'
import { toAbsoluteGlob } from './glob'

const importGlobRE = /\bimport\.meta\.(importGlob|glob|globEager|globEagerDefault)(?:<\w+>)?\s*\(/g

const knownOptions = {
  as: 'string',
  eager: 'boolean',
  export: 'string',
} as const

const forceDefaultAs = ['raw', 'url']

export function parseImportGlob(
  code: string,
  dir: string,
  root: string,
): ParsedImportGlob[] {
  const matchs = Array.from(code.matchAll(importGlobRE))

  return matchs.map((match, index) => {
    const type = match[1]
    const start = match.index!

    const err = (msg: string) => {
      const e = new Error(`Invalid glob import syntax: ${msg}`)
      ;(e as any).pos = start
      return e
    }

    let ast: SequenceExpression | Literal | ArrayExpression = undefined!

    try {
      ast = parseExpressionAt(
        code,
        start + match[0].length - 1,
        {
          ecmaVersion: 'latest',
          sourceType: 'module',
          ranges: true,
        },
      ) as any
    }
    catch (e) {
      const _e = e as any
      if (_e.message && _e.message.startsWith('Unterminated string constant'))
        return undefined!
      if (_e.pos != null && code[_e.pos] === ')')
        throw err('Expected 1-2 arguments, but got 0')
      throw _e
    }

    let arg1: ArrayExpression | Literal
    let arg2: Node | undefined

    if (ast.type === 'SequenceExpression') {
      if (ast.expressions.length < 1 || ast.expressions.length > 2)
        throw err(`Expected 1-2 arguments, but got ${ast.expressions.length}`)

      arg1 = ast.expressions[0] as any
      arg2 = ast.expressions[1]
    }
    else if (ast.type === 'Literal' || ast.type === 'ArrayExpression') {
      arg1 = ast
      arg2 = undefined
    }
    else {
      throw err('Could only use literals')
    }

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
    else if (arg1.type === 'Literal') {
      if (typeof arg1.value !== 'string')
        throw err(`Expected glob to be a string, but got "${typeof arg1.value}"`)
      globs.push(arg1.value)
    }
    else {
      throw err('Could only use literals')
    }

    if (!globs.every(i => i.match(/^[.\/!]/)))
      throw err('pattern must start with "." or "/" (relative to project root) or alias path')

    // arg2
    const options: GeneralGlobOptions = {}
    if (arg2) {
      if (arg2.type !== 'ObjectExpression')
        throw err(`Expected the second argument o to be a object literal, but got "${arg2.type}"`)

      for (const property of arg2.properties) {
        if (property.type === 'SpreadElement' || property.key.type !== 'Identifier')
          throw err('Could only use literals')

        const name = property.key.name as keyof GeneralGlobOptions

        if (name === 'query') {
          if (property.value.type === 'ObjectExpression') {
            const data: Record<string, string> = {}
            for (const prop of property.value.properties) {
              if (prop.type === 'SpreadElement' || prop.key.type !== 'Identifier' || prop.value.type !== 'Literal')
                throw err('Could only use literals')
              data[prop.key.name] = prop.value.value as any
            }
            options.query = data
          }
          else if (property.value.type === 'Literal') {
            if (typeof property.value.value !== 'string')
              throw err(`Expected query to be a string, but got "${typeof property.value.value}"`)
            options.query = property.value.value
          }
          else {
            throw err('Could only use literals')
          }
          continue
        }

        if (!(name in knownOptions))
          throw err(`Unknown options ${name}`)

        if (property.value.type !== 'Literal')
          throw err('Could only use literals')

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

    if (options.as && options.query)
      throw err('Options "as" and "query" cannot be used together')

    if (options.as)
      options.query = options.as

    const end = ast.range![1] + 1

    const globsResolved = globs.map(glob => ({ globOriginal: glob, globResolved: toAbsoluteGlob(glob, root, dir) }))

    return {
      match,
      index,
      globs,
      globsResolved,
      options,
      type,
      start,
      end,
    }
  })
    .filter(Boolean)
}
