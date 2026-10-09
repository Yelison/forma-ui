// The modules of the packed package, for the checks that have to read all of them: the build may emit one file or one
// per source module, and a check that reads only `dist/index.js` would stop seeing the package the day it is a barrel.
import { readFileSync } from 'node:fs'
import { join, posix } from 'node:path'
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

/**
 * Every file that `roots` import or re-export, directly or through each other, following the relative specifiers only
 * (a package specifier is somebody else's file). `declarations` reads `./x.js` as the `x.d.ts` that stands for it, which
 * is how the declarations of the package point at each other. `missing` lists the imports that name a file the tarball
 * does not have.
 */
export function followImports(
  roots: string[],
  packed: ReadonlySet<string>,
  unpacked: string,
  declarations = false,
): { reached: Set<string>; missing: string[] } {
  const reached = new Set<string>()
  const missing: string[] = []
  const pending = [...roots]
  for (let path = pending.pop(); path !== undefined; path = pending.pop()) {
    if (reached.has(path)) continue
    reached.add(path)
    for (const specifier of staticSpecifiers(readFileSync(join(unpacked, path), 'utf8'))) {
      if (!specifier.startsWith('.')) continue
      const resolved = posix.join(posix.dirname(path), specifier)
      const target = declarations ? resolved.replace(/\.js$/, '.d.ts') : resolved
      if (packed.has(target)) pending.push(target)
      else missing.push(`${path} imports ${specifier}, which is not in the tarball`)
    }
  }
  return { reached, missing }
}
