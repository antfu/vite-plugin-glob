import type { ModuleNode, Plugin, ResolvedConfig, ViteDevServer } from 'vite'
import { isMatch } from 'micromatch'
import type { ParsedImportGlob, PluginOptions } from '../types'
import { transform } from './transform'
import { toAbsoluteGlob } from './glob'

export * from '../types.d'

export default function(_options: PluginOptions = {}): Plugin {
  let server: ViteDevServer | undefined
  let config: ResolvedConfig
  const map = new Map<string, string[][]>()

  function updateMap(id: string, info: ParsedImportGlob[]) {
    const globs = info.map(i => i.globs.map(i => toAbsoluteGlob(i, config?.root || process.cwd(), id)))
    map.set(id, globs)
    // add those globs to the wather
    server?.watcher.add(globs.flatMap(i => i.filter(i => i[0] !== '!')))
  }

  function getAffectedModules(file: string) {
    const modules: ModuleNode[] = []
    for (const [id, globs] of map) {
      if (globs.some(glob => isMatch(file, glob)))
        modules.push(...(server?.moduleGraph.getModulesByFile(id) || []))
    }
    return modules
  }

  return {
    name: 'vite-plugin-glob',
    config() {
      return {
        server: {
          watch: {
            disableGlobbing: false,
          },
        },
      }
    },
    configResolved(_config) {
      config = _config
    },
    buildStart() {
      map.clear()
    },
    configureServer(_server) {
      server = _server

      // file unlink won't be handled by handleHotUpdate,
      // so we do the update manually
      server.watcher.on('unlink', (file: string) => {
        const modules = getAffectedModules(file)
        _server.ws.send({
          type: 'update',
          updates: modules.map((mod) => {
            _server.moduleGraph.invalidateModule(mod)
            return {
              acceptedPath: mod.id!,
              path: mod.id!,
              timestamp: Date.now(),
              type: 'js-update',
            }
          }),
        })
      })
    },
    handleHotUpdate({ file }) {
      const modules = getAffectedModules(file)
      if (modules.length)
        return modules
    },
    async transform(code, id) {
      const result = await transform(code, id, this.parse)
      if (result) {
        updateMap(id, result.matches)
        return {
          code: result.s.toString(),
          map: result.s.generateMap(),
        }
      }
    },
  }
}
