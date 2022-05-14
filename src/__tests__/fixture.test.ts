import { resolve } from 'path'
import { promises as fs } from 'fs'
import { describe, expect, it } from 'vitest'
import { transformWithEsbuild } from 'vite'
import { transform } from '../plugin'

describe('fixture', async () => {
  const resolveId = (id: string) => id
  const options = { takeover: true }

  it('transform', async () => {
    const id = resolve(__dirname, './fixture-a/index.ts')
    const code = (await transformWithEsbuild(await fs.readFile(id, 'utf-8'), id)).code
    const root = process.cwd()

    expect((await transform(code, id, root, resolveId, options))?.s.toString())
      .toMatchSnapshot()
  })

  it('virtual modules', async () => {
    const root = resolve(__dirname, './fixture-a')
    const code = [
      'import.meta.glob(\'/modules/*.ts\')',
      'import.meta.glob([\'/../fixture-b/*.ts\'])',
    ].join('\n')
    expect((await transform(code, 'virtual:module', root, resolveId, options))?.s.toString())
      .toMatchInlineSnapshot(`
        "Object.assign({
        \\"/modules/a.ts\\": () => import(\\"/modules/a.ts\\"),
        \\"/modules/b.ts\\": () => import(\\"/modules/b.ts\\"),
        \\"/modules/index.ts\\": () => import(\\"/modules/index.ts\\")
        })
        Object.assign({
        \\"/../fixture-b/a.ts\\": () => import(\\"/../fixture-b/a.ts\\"),
        \\"/../fixture-b/b.ts\\": () => import(\\"/../fixture-b/b.ts\\"),
        \\"/../fixture-b/index.ts\\": () => import(\\"/../fixture-b/index.ts\\")
        })"
      `,
      )

    try {
      await transform('import.meta.glob(\'./modules/*.ts\')', 'virtual:module', root, resolveId, options)
      expect('no error').toBe('should throw an error')
    }
    catch (err) {
      expect(err).toMatchInlineSnapshot('[Error: In virtual modules, all globs must start with \'/\']')
    }
  })

  it('transform with restoreQueryExtension', async () => {
    const id = resolve(__dirname, './fixture-a/index.ts')
    const code = (await transformWithEsbuild(await fs.readFile(id, 'utf-8'), id)).code
    const root = process.cwd()

    expect((await transform(code, id, root, resolveId, { ...options, restoreQueryExtension: true }))?.s.toString())
      .toMatchSnapshot()
  })
})
