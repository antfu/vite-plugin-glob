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
