// The modules of the packed package, for the checks that have to read all of them: the build may emit one file or one
// per source module, and a check that reads only `dist/index.js` would stop seeing the package the day it is a barrel.
import type { PackedFile } from '../check-support.ts'

// `import … from 'x'`, `export … from 'x'` and `import 'x'`. It reads JavaScript and declaration files alike.
const staticImport = /\b(?:import|export)\b[^'";]*?\bfrom\s*["']([^"']+)["']|\bimport\s*["']([^"']+)["']/g

/** The specifiers that `source` imports or re-exports statically. */
export function staticSpecifiers(source: string): string[] {
  return [...source.matchAll(staticImport)].map((match) => match[1] ?? match[2]!)
}

/** The JavaScript modules of the tarball, as paths inside the package (`dist/components/Badge/Badge.js`). */
export function packedModules(files: PackedFile[]): string[] {
  return files.map((file) => file.path).filter((path) => path.startsWith('dist/') && path.endsWith('.js'))
}
