import { resolve } from 'path'
import { promises as fs } from 'fs'
import { parse } from 'acorn'
import { describe, expect, it } from 'vitest'
import { transform } from '../src/transform'

describe('fixture', async() => {
  it('transform', async() => {
    const id = resolve(__dirname, './fixtures/index.ts')
    const code = await fs.readFile(id, 'utf-8')

    expect((await transform(code, id, parse, { takeover: true }))?.s.toString())
      .toMatchInlineSnapshot(`
        "import * as __vite_glob_next_1_0 from './modules/a.ts'
        import * as __vite_glob_next_1_1 from './modules/b.ts'
        import * as __vite_glob_next_1_2 from './modules/index.ts'
        import { name as __vite_glob_next_3_0 } from './modules/a.ts'
        import { name as __vite_glob_next_3_1 } from './modules/b.ts'
        import { name as __vite_glob_next_3_2 } from './modules/index.ts'
        import { default as __vite_glob_next_5_0 } from './modules/a.ts?raw'
        import { default as __vite_glob_next_5_1 } from './modules/b.ts?raw'
        export interface ModuleType {
          name: string
        }
        
        export const basic = {
        './modules/a.ts': () => import('./modules/a.ts'),
        './modules/b.ts': () => import('./modules/b.ts'),
        './modules/index.ts': () => import('./modules/index.ts')
        }
        
        export const basicEager = {
        './modules/a.ts': __vite_glob_next_1_0,
        './modules/b.ts': __vite_glob_next_1_1,
        './modules/index.ts': __vite_glob_next_1_2
        }
        
        export const ignore = {
        './modules/a.ts': () => import('./modules/a.ts'),
        './modules/b.ts': () => import('./modules/b.ts')
        }
        
        export const namedEager = {
        './modules/a.ts': __vite_glob_next_3_0,
        './modules/b.ts': __vite_glob_next_3_1,
        './modules/index.ts': __vite_glob_next_3_2
        }
        
        export const namedDefault = {
        './modules/a.ts': () => import('./modules/a.ts').then(m => m['default']),
        './modules/b.ts': () => import('./modules/b.ts').then(m => m['default']),
        './modules/index.ts': () => import('./modules/index.ts').then(m => m['default'])
        }
        
        export const eagerAs = {
        './modules/a.ts': __vite_glob_next_5_0,
        './modules/b.ts': __vite_glob_next_5_1
        }
        
        export const excludeSelf = {
        './sibling.ts': () => import('./sibling.ts')
        }
        "
      `)
  })
})
