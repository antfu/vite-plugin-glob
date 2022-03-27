import { resolve } from 'path'
import { promises as fs } from 'fs'
import { describe, expect, it } from 'vitest'
import { transform } from '../src/transform'

describe('should', async() => {
  const id = resolve(__dirname, './fixtures/index.ts')
  const code = await fs.readFile(id, 'utf-8')

  it('transform', async() => {
    expect((await transform(code, id))?.code)
      .toMatchInlineSnapshot(`
        "export interface ModuleType {
          name: string
        }
        
        export const list = {'./modules/a.ts': () => import('./modules/a.ts'), './modules/b.ts': () => import('./modules/b.ts'), './modules/index.ts': () => import('./modules/index.ts')}
        "
      `)
  })
})
