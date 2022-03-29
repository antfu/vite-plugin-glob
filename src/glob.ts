import { posix } from 'path'

export function toAbsoluteGlob(glob: string, root: string, dirname: string): string {
  let pre = ''
  if (glob.startsWith('!')) {
    pre = '!'
    glob = glob.slice(1)
  }

  if (glob.startsWith('/'))
    return pre + posix.join(root, glob.slice(1))
  if (glob.startsWith('./'))
    return pre + posix.join(dirname, glob.slice(2))
  if (glob.startsWith('../'))
    return pre + posix.join(dirname, glob)
  if (glob.startsWith('**'))
    return pre + glob

  throw new Error(`Invalid glob: ${glob}. It must starts with '/' or './'`)
}
