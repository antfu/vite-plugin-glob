export interface ModuleType {
  name: string
}

export const list1 = import.meta.globNext<ModuleType>('./modules/*.ts')

export const list2 = import.meta.globNext([
  './modules/*.ts',
  '!**/index.ts',
])
