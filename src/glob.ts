import { posix } from 'path'

export async function toAbsoluteGlob(
  glob: string,
  root: string,
  dirname: string,
  resolveId: (id: string) => string | Promise<string>,
): Promise<string> {
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

  const resolved = await resolveId(glob)
  if (resolved.startsWith('/'))
    return pre + resolved

  throw new Error(`Invalid glob: ${glob}. It must starts with '/' or './'`)
}
