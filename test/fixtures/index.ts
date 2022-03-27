export interface ModuleType {
  name: string
}

export const list = import.meta.globNext<ModuleType>('./modules/*.ts')
