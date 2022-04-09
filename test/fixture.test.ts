import { resolve } from 'path'
import { promises as fs } from 'fs'
import { describe, expect, it } from 'vitest'
import { transformWithEsbuild } from 'vite'
import { transform } from '../src/transform'

describe('fixture', async() => {
  const resolveId = (id: string) => id
  const options = { takeover: true }

  it('transform', async() => {
    const id = resolve(__dirname, './fixtures/index.ts')
    const code = (await transformWithEsbuild(await fs.readFile(id, 'utf-8'), id)).code
    const root = process.cwd()

    expect((await transform(code, id, root, resolveId, options))?.s.toString())
      .toMatchInlineSnapshot(`
        "import * as __vite_glob_next_1_0 from \\"./modules/a.ts\\"
        import * as __vite_glob_next_1_1 from \\"./modules/b.ts\\"
        import * as __vite_glob_next_1_2 from \\"./modules/index.ts\\"
        import { name as __vite_glob_next_3_0 } from \\"./modules/a.ts\\"
        import { name as __vite_glob_next_3_1 } from \\"./modules/b.ts\\"
        import { name as __vite_glob_next_3_2 } from \\"./modules/index.ts\\"
        import { default as __vite_glob_next_5_0 } from \\"./modules/a.ts?raw\\"
        import { default as __vite_glob_next_5_1 } from \\"./modules/b.ts?raw\\"
        export const basic = {
        \\"./modules/a.ts\\": () => import(\\"./modules/a.ts\\"),
        \\"./modules/b.ts\\": () => import(\\"./modules/b.ts\\"),
        \\"./modules/index.ts\\": () => import(\\"./modules/index.ts\\")
        };
        export const basicEager = {
        \\"./modules/a.ts\\": __vite_glob_next_1_0,
        \\"./modules/b.ts\\": __vite_glob_next_1_1,
        \\"./modules/index.ts\\": __vite_glob_next_1_2
        };
        export const ignore = {
        \\"./modules/a.ts\\": () => import(\\"./modules/a.ts\\"),
        \\"./modules/b.ts\\": () => import(\\"./modules/b.ts\\")
        };
        export const namedEager = {
        \\"./modules/a.ts\\": __vite_glob_next_3_0,
        \\"./modules/b.ts\\": __vite_glob_next_3_1,
        \\"./modules/index.ts\\": __vite_glob_next_3_2
        };
        export const namedDefault = {
        \\"./modules/a.ts\\": () => import(\\"./modules/a.ts\\").then(m => m[\\"default\\"]),
        \\"./modules/b.ts\\": () => import(\\"./modules/b.ts\\").then(m => m[\\"default\\"]),
        \\"./modules/index.ts\\": () => import(\\"./modules/index.ts\\").then(m => m[\\"default\\"])
        };
        export const eagerAs = {
        \\"./modules/a.ts\\": __vite_glob_next_5_0,
        \\"./modules/b.ts\\": __vite_glob_next_5_1
        };
        export const excludeSelf = {
        \\"./sibling.ts\\": () => import(\\"./sibling.ts\\")
        };
        export const customQueryString = {
        \\"./sibling.ts\\": () => import(\\"./sibling.ts?custom&lang.ts\\")
        };
        export const customQueryObject = {
        \\"./sibling.ts\\": () => import(\\"./sibling.ts?foo=bar&raw=true&lang.ts\\")
        };
        export const parent = {
        \\"../../playground/src/main.ts\\": () => import(\\"../../playground/src/main.ts?url&lang.ts\\").then(m => m[\\"default\\"])
        };
        export const rootMixedRelative = {
        \\"/build.config.ts\\": () => import(\\"../../build.config.ts?url&lang.ts\\").then(m => m[\\"default\\"]),
        \\"/client.d.ts\\": () => import(\\"../../client.d.ts?url&lang.ts\\").then(m => m[\\"default\\"]),
        \\"/playground/package.json\\": () => import(\\"../../playground/package.json?url&lang.json\\").then(m => m[\\"default\\"]),
        \\"/takeover.d.ts\\": () => import(\\"../../takeover.d.ts?url&lang.ts\\").then(m => m[\\"default\\"]),
        \\"/types.ts\\": () => import(\\"../../types.ts?url&lang.ts\\").then(m => m[\\"default\\"])
        };
        export const cleverCwd1 = {
        \\"./node_modules/framework/pages/hello.page.js\\": () => import(\\"./node_modules/framework/pages/hello.page.js\\")
        };
        export const cleverCwd2 = {
        \\"../../playground/src/fixtures/a.ts\\": () => import(\\"../../playground/src/fixtures/a.ts\\"),
        \\"../../playground/src/fixtures/b.ts\\": () => import(\\"../../playground/src/fixtures/b.ts\\"),
        \\"./modules/a.ts\\": () => import(\\"./modules/a.ts\\"),
        \\"./modules/b.ts\\": () => import(\\"./modules/b.ts\\")
        };
        "
      `)
  })

  it('virtual modules', async() => {
    const root = resolve(__dirname, './fixtures')
    expect((await transform('import.meta.glob(\'/modules/*.ts\')', 'virtual:module', root, resolveId, options))?.s.toString())
      .toMatchInlineSnapshot(`
"{
\\"/modules/a.ts\\": () => import(\\"/modules/a.ts\\"),
\\"/modules/b.ts\\": () => import(\\"/modules/b.ts\\"),
\\"/modules/index.ts\\": () => import(\\"/modules/index.ts\\")
}"`,
      )

    try {
      await transform('import.meta.glob(\'./modules/*.ts\')', 'virtual:module', root, resolveId, options)
      expect('no error').toBe('should throw an error')
    }
    catch (err) {
      expect(err).toMatchInlineSnapshot('[Error: In virtual modules, all globs must start with \'/\']')
    }
  })
})
