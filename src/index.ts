import type { Plugin } from 'vite'
import { transform } from './transform'

export interface Options {

}

export default function(_options: Options = {}): Plugin {
  // TODO: support HMR for new modules
  return {
    name: 'vite-plugin-glob',
    transform(code, id) {
      return transform(code, id, this.parse)
    },
  }
}
