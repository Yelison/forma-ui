// Helpers shared by the generators in this folder (build-tokens.ts, build-icons.ts). Erasable TypeScript only, so
// that type stripping can run them.
import { existsSync, mkdirSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

/** Writes `content` to `path`, creating the missing directories. */
export function write(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
}

/**
 * Whether the module at `moduleFile` (its `import.meta.filename`) is the one Node was started with, so that a script
 * can export functions for its tests and still run when invoked.
 *
 * Node resolves the main module to its real path, so a symlinked invocation must be compared by real path too.
 * Whoever imports the module may have an argv[1] that is no file at all (`node -e "await import(...)" name`).
 */
export function isMainModule(moduleFile: string): boolean {
  const entry = process.argv[1]
  return entry !== undefined && existsSync(entry) && realpathSync(entry) === moduleFile
}
