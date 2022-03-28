export interface ModuleType {
  name: string
}

export const list1 = import.meta.importGlob<ModuleType>('./modules/*.ts')

export const list2 = import.meta.importGlob([
  './modules/*.ts',
  '!**/index.ts',
])

export const list3 = import.meta.importGlob<ModuleType>([
  './modules/*.ts',
  '!**/index.ts',
], { eager: true, as: 'raw' })

export const list4 = import.meta.importGlob<ModuleType>('./modules/*.ts', { eager: true })

export const list5 = import.meta.importGlob<string>('./modules/*.ts', { eager: true, export: 'name' })
