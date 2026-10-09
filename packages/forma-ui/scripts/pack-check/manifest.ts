// The package.json of the packed package, read from the unpacked tarball (what a consumer gets, not the source).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export interface PackedManifest {
  main?: string
  types?: string
  sideEffects?: boolean | string[]
  exports: Record<string, string | Record<string, string>>
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

export function readManifest(unpacked: string): PackedManifest {
  return JSON.parse(readFileSync(join(unpacked, 'package.json'), 'utf8')) as PackedManifest
}

/** Every file that `main`, `types` and `exports` point at, as paths inside the package (`dist/index.js`). */
export function entryTargets(manifest: PackedManifest): string[] {
  const collect = (value: string | Record<string, string>): string[] =>
    typeof value === 'string' ? [value] : Object.values(value).flatMap(collect)
  const targets = [manifest.main, manifest.types, ...Object.values(manifest.exports).flatMap(collect)]
  return [...new Set(targets.filter((target): target is string => target !== undefined))].map((target) =>
    target.replace(/^\.\//, ''),
  )
}
