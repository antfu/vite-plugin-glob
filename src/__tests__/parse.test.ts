import { describe, expect, it } from 'vitest'
import { parseImportGlob } from '../plugin'

async function run(input: string) {
  const items = await parseImportGlob(input, process.cwd(), process.cwd(), id => id)
  return items.map(i => ({ globs: i.globs, options: i.options, start: i.start }))
}

async function runError(input: string) {
  try {
    await run(input)
  }
  catch (e) {
    return e
  }
}

describe('parse positives', async () => {
  it('basic', async () => {
    expect(await run(`
    import.meta.importGlob(\'./modules/*.ts\')
    `)).toMatchInlineSnapshot(`
      [
        {
          "globs": [
            "./modules/*.ts",
          ],
          "options": {},
          "start": 5,
        },
      ]
    `)
  })

  it('array', async () => {
    expect(await run(`
    import.meta.importGlob([\'./modules/*.ts\', './dir/*.{js,ts}\'])
    `)).toMatchInlineSnapshot(`
      [
        {
          "globs": [
            "./modules/*.ts",
            "./dir/*.{js,ts}",
          ],
          "options": {},
          "start": 5,
        },
      ]
    `)
  })

  it('options with multilines', async () => {
    expect(await run(`
    import.meta.importGlob([
      \'./modules/*.ts\',
      "!./dir/*.{js,ts}"
    ], {
      eager: true,
      import: 'named'
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
            "import": "named",
          },
          "start": 5,
        },
      ]
    `)
  })

  it('options with multilines', async () => {
    expect(await run(`
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
          "start": 21,
        },
      ]
    `)
  })

  it('options query', async () => {
    expect(await run(`
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
          "start": 21,
        },
      ]
    `)
  })

  it('object properties - 1', async () => {
    expect(await run(`
    export const pageFiles = {
      '.page': import.meta.glob('/**/*.page.*([a-zA-Z0-9])')
};`)).toMatchInlineSnapshot(`
  [
    {
      "globs": [
        "/**/*.page.*([a-zA-Z0-9])",
      ],
      "options": {},
      "start": 47,
    },
  ]
`)
  })

  it('object properties - 2', async () => {
    expect(await run(`
    export const pageFiles = {
      '.page': import.meta.glob('/**/*.page.*([a-zA-Z0-9])'),
};`)).toMatchInlineSnapshot(`
  [
    {
      "globs": [
        "/**/*.page.*([a-zA-Z0-9])",
      ],
      "options": {},
      "start": 47,
    },
  ]
`)
  })

  // Error of #21
  it('object properties - 3', async () => {
    expect(await run(`
    export const pageFiles = {
      '.page.client': import.meta.glob('/**/*.page.client.*([a-zA-Z0-9])'),
      '.page.server': import.meta.glob('/**/*.page.server.*([a-zA-Z0-9])'),
};`)).toMatchInlineSnapshot(`
  [
    {
      "globs": [
        "/**/*.page.client.*([a-zA-Z0-9])",
      ],
      "options": {},
      "start": 54,
    },
    {
      "globs": [
        "/**/*.page.server.*([a-zA-Z0-9])",
      ],
      "options": {},
      "start": 130,
    },
  ]
`)
  })

  it('array item', async () => {
    expect(await run(`
    export const pageFiles = [
      import.meta.glob('/**/*.page.client.*([a-zA-Z0-9])'),
      import.meta.glob('/**/*.page.server.*([a-zA-Z0-9])'),
    ]`)).toMatchInlineSnapshot(`
      [
        {
          "globs": [
            "/**/*.page.client.*([a-zA-Z0-9])",
          ],
          "options": {},
          "start": 38,
        },
        {
          "globs": [
            "/**/*.page.server.*([a-zA-Z0-9])",
          ],
          "options": {},
          "start": 98,
        },
      ]
    `)
  })
})

describe('parse negatives', async () => {
  it('syntax error', async () => {
    expect(await runError('import.meta.importGlob('))
      .toMatchInlineSnapshot('[SyntaxError: Unexpected token (1:23)]')
  })

  it('empty', async () => {
    expect(await runError('import.meta.importGlob()'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: Expected 1-2 arguments, but got 0]')
  })

  it('3 args', async () => {
    expect(await runError('import.meta.importGlob("", {}, {})'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: Expected 1-2 arguments, but got 3]')
  })

  it('in string', async () => {
    expect(await runError('"import.meta.importGlob()"'))
      .toBeUndefined()
  })

  it('variable', async () => {
    expect(await runError('import.meta.importGlob(hey)'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: Could only use literals]')
  })

  it('template', async () => {
    // eslint-disable-next-line no-template-curly-in-string
    expect(await runError('import.meta.importGlob(`hi ${hey}`)'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: Could only use literals]')
  })

  it('be string', async () => {
    expect(await runError('import.meta.importGlob(1)'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: Expected glob to be a string, but got "number"]')
  })

  it('be array variable', async () => {
    expect(await runError('import.meta.importGlob([hey])'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: Could only use literals]')
    expect(await runError('import.meta.importGlob(["1", hey])'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: Could only use literals]')
  })

  it('options', async () => {
    expect(await runError('import.meta.importGlob("hey", hey)'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: Expected the second argument o to be a object literal, but got "Identifier"]')
    expect(await runError('import.meta.importGlob("hey", [])'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: Expected the second argument o to be a object literal, but got "ArrayExpression"]')
  })

  it('options props', async () => {
    expect(await runError('import.meta.importGlob("hey", { hey: 1 })'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: Unknown options hey]')
    expect(await runError('import.meta.importGlob("hey", { import: hey })'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: Could only use literals]')
    expect(await runError('import.meta.importGlob("hey", { eager: 123 })'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: Expected the type of option "eager" to be "boolean", but got "number"]')
  })

  it('options query', async () => {
    expect(await runError('import.meta.importGlob("./*.js", { as: "raw", query: "hi" })'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: Options "as" and "query" cannot be used together]')
    expect(await runError('import.meta.importGlob("./*.js", { query: 123 })'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: Expected query to be a string, but got "number"]')
    expect(await runError('import.meta.importGlob("./*.js", { query: { foo: {} } })'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: Could only use literals]')
    expect(await runError('import.meta.importGlob("./*.js", { query: { foo: hey } })'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: Could only use literals]')
    expect(await runError('import.meta.importGlob("./*.js", { query: { foo: 123, ...a } })'))
      .toMatchInlineSnapshot('[Error: Invalid glob import syntax: Could only use literals]')
  })
})
