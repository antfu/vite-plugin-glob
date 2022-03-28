import { posix } from 'path'

const { join, dirname } = posix

export function toAbsoluteGlob(glob: string, root: string, id: string): string {
  let pre = ''
  if (glob.startsWith('!')) {
    pre = '!'
    glob = glob.slice(1)
  }

  if (glob.startsWith('/'))
    return pre + join(root, glob.slice(1))
  if (glob.startsWith('./'))
    return pre + join(dirname(id), glob.slice(2))
  if (glob.startsWith('**'))
    return pre + glob

  throw new Error(`Invalid glob: ${glob}. It must starts with '/' or './'`)
}
