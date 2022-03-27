export interface ModuleType {
  name: string
}

export const list1 = import.meta.myGlob<ModuleType>('./modules/*.ts')

export const list2 = import.meta.myGlob([
  './modules/*.ts',
  '!**/index.ts',
])

export const list3 = import.meta.myGlob<ModuleType>([
  './modules/*.ts',
  '!**/index.ts',
], { eager: true, as: 'raw' })

export const list4 = import.meta.myGlob<ModuleType>('./modules/*.ts', { eager: true })
