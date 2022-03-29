import { describe, expect, it } from 'vitest'
import { parseImportGlob } from '../src/parse'

function run(input: string) {
  return parseImportGlob(input, process.cwd(), process.cwd()).map((i) => {
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

  it('options with multilines', async() => {
    expect(run(`
    const modules = import.meta.glob(
      '/dir/**'
      // for test: annotation contain ")"
      /*
       * for test: annotation contain ")"
       * */
    )
    `)).toMatchInlineSnapshot(`
      [
        {
          "globs": [
            "/dir/**",
          ],
          "options": {},
        },
      ]
    `)
  })

  it('options query', async() => {
    expect(run(`
    const modules = import.meta.glob(
      '/dir/**',
      {
        query: {
          foo: 'bar',
          raw: true,
        }
      }
    )
    `)).toMatchInlineSnapshot(`
      [
        {
          "globs": [
            "/dir/**",
          ],
          "options": {
            "query": {
              "foo": "bar",
              "raw": true,
            },
          },
        },
      ]
    `)
  })
})

describe('parse negatives', async() => {
  it('syntax error', async() => {
    expect(runError('import.meta.importGlob('))
      .toMatchInlineSnapshot('[SyntaxError: Unexpected token (1:23)]')
  })

  it('empty', async() => {
    expect(runError('import.meta.importGlob()'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: Expected 1-2 arguments, but got 0]')
  })

  it('3 args', async() => {
    expect(runError('import.meta.importGlob("", {}, {})'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: Expected 1-2 arguments, but got 3]')
  })

  it('in string', async() => {
    expect(runError('"import.meta.importGlob()"'))
      .toBeUndefined()
  })

  it('variable', async() => {
    expect(runError('import.meta.importGlob(hey)'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: Could only use literals]')
  })

  it('template', async() => {
    // eslint-disable-next-line no-template-curly-in-string
    expect(runError('import.meta.importGlob(`hi ${hey}`)'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: Could only use literals]')
  })

  it('be string', async() => {
    expect(runError('import.meta.importGlob(1)'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: Expected glob to be a string, but got "number"]')
  })

  it('be array variable', async() => {
    expect(runError('import.meta.importGlob([hey])'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: Could only use literals]')
    expect(runError('import.meta.importGlob(["1", hey])'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: Could only use literals]')
  })

  it('options', async() => {
    expect(runError('import.meta.importGlob("hey", hey)'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: pattern must start with "." or "/" (relative to project root) or alias path]')
    expect(runError('import.meta.importGlob("hey", [])'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: pattern must start with "." or "/" (relative to project root) or alias path]')
  })

  it('options props', async() => {
    expect(runError('import.meta.importGlob("hey", { hey: 1 })'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: pattern must start with "." or "/" (relative to project root) or alias path]')
    expect(runError('import.meta.importGlob("hey", { export: hey })'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: pattern must start with "." or "/" (relative to project root) or alias path]')
    expect(runError('import.meta.importGlob("hey", { eager: 123 })'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: pattern must start with "." or "/" (relative to project root) or alias path]')
  })

  it('options query', async() => {
    expect(runError('import.meta.importGlob("./*.js", { as: "raw", query: "hi" })'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: Options "as" and "query" cannot be used together]')
    expect(runError('import.meta.importGlob("./*.js", { query: 123 })'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: Expected query to be a string, but got "number"]')
    expect(runError('import.meta.importGlob("./*.js", { query: { foo: {} } })'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: Could only use literals]')
    expect(runError('import.meta.importGlob("./*.js", { query: { foo: hey } })'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: Could only use literals]')
    expect(runError('import.meta.importGlob("./*.js", { query: { foo: 123, ...a } })'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: Could only use literals]')
  })
})
