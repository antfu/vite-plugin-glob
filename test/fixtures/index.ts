export interface ModuleType {
  name: string
}

export const basic = import.meta.glob<ModuleType>('./modules/*.ts')

export const basicEager = import.meta.glob<ModuleType>('./modules/*.ts', { eager: true })

export const ignore = import.meta.glob([
  './modules/*.ts',
  '!**/index.ts',
])

export const namedEager = import.meta.glob<string>('./modules/*.ts', { eager: true, export: 'name' })

export const namedDefault = import.meta.glob<string>('./modules/*.ts', { export: 'default' })

export const eagerAs = import.meta.glob<ModuleType>([
  './modules/*.ts',
  '!**/index.ts',
], { eager: true, as: 'raw' })

export const excludeSelf = import.meta.glob('./*.ts')

export const customQueryString = import.meta.glob('./*.ts', { query: 'custom' })

export const customQueryObject = import.meta.glob('./*.ts', {
  query: {
    foo: 'bar',
    raw: true,
  },
})

export const parent = import.meta.glob('../../playground/src/*.ts', { as: 'url' })

export const rootMixedRelative = import.meta.glob([
  '/*.ts',
  '../../playground/*.json',
], { as: 'url' })

export const cleverCwd1 = import.meta.glob('./node_modules/framework/**/*.page.js')

export const cleverCwd2 = import.meta.glob([
  './modules/*.ts',
  '../../playground/src/fixtures/*.ts',
  '!**/index.ts',
])
