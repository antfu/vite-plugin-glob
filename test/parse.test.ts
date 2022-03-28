import { describe, expect, it } from 'vitest'
import { parse } from 'acorn'
import { parseImportGlob } from '../src/parse'

function run(input: string) {
  return parseImportGlob(input, parse).map((i) => {
    return { globs: i.globs, options: i.options }
  })
}

function runError(input: string) {
  try {
    run(input)
  }
  catch (e) {
    return e
  }

  throw new Error('Should throw')
}

describe('parse positives', async() => {
  it('basic', async() => {
    expect(run(`
    import.meta.importGlob(\'./modules/*.ts\')
    `)).toMatchInlineSnapshot(`
      [
        {
          "globs": [
            "./modules/*.ts",
          ],
          "options": {},
        },
      ]
    `)
  })

  it('array', async() => {
    expect(run(`
    import.meta.importGlob([\'./modules/*.ts\', './dir/*.{js,ts}\'])
    `)).toMatchInlineSnapshot(`
      [
        {
          "globs": [
            "./modules/*.ts",
            "./dir/*.{js,ts}",
          ],
          "options": {},
        },
      ]
    `)
  })

  it('options with multilines', async() => {
    expect(run(`
    import.meta.importGlob([
      \'./modules/*.ts\',
      "!./dir/*.{js,ts}"
    ], {
      eager: true,
      export: 'named'
    })
    `)).toMatchInlineSnapshot(`
      [
        {
          "globs": [
            "./modules/*.ts",
            "!./dir/*.{js,ts}",
          ],
          "options": {
            "eager": true,
            "export": "named",
          },
        },
      ]
    `)
  })
})

describe('parse negatives', async() => {
  it('variable', async() => {
    expect(runError('import.meta.importGlob(hey)'))
      .toMatchInlineSnapshot('[Error: Could only use literals in import.meta.importGlob]')
  })

  it('template', async() => {
    // eslint-disable-next-line no-template-curly-in-string
    expect(runError('import.meta.importGlob(`hi ${hey}`)'))
      .toMatchInlineSnapshot('[Error: Could only use literals in import.meta.importGlob]')
  })

  it('be string', async() => {
    expect(runError('import.meta.importGlob(1)'))
      .toMatchInlineSnapshot('[Error: Expected glob to be a string, but got "number"]')
  })

  it('be array variable', async() => {
    expect(runError('import.meta.importGlob([hey])'))
      .toMatchInlineSnapshot('[Error: Could only use literals in import.meta.importGlob]')
    expect(runError('import.meta.importGlob(["1", hey])'))
      .toMatchInlineSnapshot('[Error: Could only use literals in import.meta.importGlob]')
  })

  it('options', async() => {
    expect(runError('import.meta.importGlob("hey", hey)'))
      .toMatchInlineSnapshot('[Error: Expected the second argument of import.meta.importGlob to be a object literal, but got "Identifier"]')
    expect(runError('import.meta.importGlob("hey", [])'))
      .toMatchInlineSnapshot('[Error: Expected the second argument of import.meta.importGlob to be a object literal, but got "ArrayExpression"]')
  })

  it('options props', async() => {
    expect(runError('import.meta.importGlob("hey", { hey: 1 })'))
      .toMatchInlineSnapshot('[Error: Unknown options hey]')
    expect(runError('import.meta.importGlob("hey", { export: hey })'))
      .toMatchInlineSnapshot('[Error: Could only use literals in import.meta.importGlob]')
    expect(runError('import.meta.importGlob("hey", { eager: 123 })'))
      .toMatchInlineSnapshot('[Error: Expected the type of option "eager" to be "boolean", but got "number"]')
  })
})
