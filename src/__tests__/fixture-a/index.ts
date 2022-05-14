/* eslint-disable @typescript-eslint/comma-dangle */
export interface ModuleType {
  name: string
}

export const basic = import.meta.glob<ModuleType>('./modules/*.ts')

export const basicEager = import.meta.glob<ModuleType>('./modules/*.ts', { eager: true })

export const ignore = import.meta.glob([
  './modules/*.ts',
  '!**/index.ts',
])

export const namedEager = import.meta.glob<string>('./modules/*.ts', { eager: true, import: 'name' })

export const namedDefault = import.meta.glob<string>('./modules/*.ts', { import: 'default' })

export const eagerAs = import.meta.glob<ModuleType>([
  './modules/*.ts',
  '!**/index.ts',
], { eager: true, as: 'raw' })

export const excludeSelf = import.meta.glob(
  './*.ts'
  // for test: annotation contain ")"
  /*
   * for test: annotation contain ")"
   * */
)

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
  '../fixture-b/*.ts',
], { as: 'url' })

export const cleverCwd1 = import.meta.glob(
  './node_modules/framework/**/*.page.js'
)

export const cleverCwd2 = import.meta.glob([
  './modules/*.ts',
  '../fixture-b/*.ts',
  '!**/index.ts',
],
)

export const keys = Object.keys({ ...import.meta.glob('./modules/*.ts') })
