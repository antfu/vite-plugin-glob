export interface ModuleType {
  name: string
}

export const basic = import.meta.importGlob<ModuleType>('./modules/*.ts')

export const basicEager = import.meta.importGlob<ModuleType>('./modules/*.ts', { eager: true })

export const ignore = import.meta.importGlob([
  './modules/*.ts',
  '!**/index.ts',
])

export const namedEager = import.meta.importGlob<string>('./modules/*.ts', { eager: true, export: 'name' })

export const namedDefault = import.meta.importGlob<string>('./modules/*.ts', { export: 'default' })

export const eagerAs = import.meta.importGlob<ModuleType>([
  './modules/*.ts',
  '!**/index.ts',
], { eager: true, as: 'raw' })
