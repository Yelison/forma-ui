// What the checks of this folder share (check-consumer.ts, pack-check.ts): running a command, packing the package and
// installing the tarball into a consumer. Erasable TypeScript only, so that type stripping can run the scripts.
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, symlinkSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

export const packageRoot = resolve(import.meta.dirname, '..')
export const packageName = '@yelison/forma-ui'
export const repositoryModules = resolve(packageRoot, '../../node_modules')

/** A failed check: its message is what the person reading the CI log needs. */
export class CheckFailure extends Error {}

export function fail(message: string): never {
  throw new CheckFailure(message)
}

/** Runs `main` and, if a check failed, prints `<label> failed: <message>` and exits with 1. Other errors propagate. */
export function runCheck(label: string, main: () => void | Promise<void>): void {
  Promise.resolve()
    .then(main)
    .catch((error: unknown) => {
      if (!(error instanceof CheckFailure)) throw error
      console.error(`${label} failed: ${error.message}`)
      process.exit(1)
    })
}

/** Bytes as kilobytes of 1000, with the two decimals that the sizes in the messages need. */
export const kilobytes = (bytes: number) => `${(bytes / 1000).toFixed(2)} kB`

export function run(command: string, args: string[], cwd: string): string {
  try {
    return execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  } catch (error) {
    const { stdout = '', stderr = '', message } = error as { stdout?: string; stderr?: string; message: string }
    // A command that never started (a missing binary, say) has no output: the error itself says why.
    return fail(`\`${[command, ...args].join(' ')}\` exited with an error:\n${stdout + stderr || message}`)
  }
}

export interface PackedFile {
  path: string
  size: number
}

/** `npm pack` into `destination`: the tarball a consumer would receive, and the files npm put in it. */
export function packTarball(destination: string): { tarball: string; files: PackedFile[] } {
  const [{ filename, files }] = JSON.parse(
    run('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', destination], packageRoot),
  ) as [{ filename: string; files: PackedFile[] }]
  return { tarball: join(destination, filename), files }
}

/** Creates `folder` as the throwaway project that the checks install the tarball into: scripts/consumer/ and a package.json. */
export function createConsumer(folder: string): void {
  mkdirSync(folder, { recursive: true })
  cpSync(join(packageRoot, 'scripts', 'consumer'), folder, { recursive: true })
  writeFileSync(join(folder, 'package.json'), JSON.stringify({ name: 'forma-consumer', private: true, type: 'module' }))
}

/**
 * Unpacks `tarball` into the `node_modules` of `consumer`, where the package resolves by name, and links the peer
 * dependencies the consumer would install itself to the repository's copies. Returns the unpacked package folder.
 */
export function installTarball(consumer: string, tarball: string): string {
  const unpacked = join(consumer, 'node_modules', '@yelison', 'forma-ui')
  mkdirSync(unpacked, { recursive: true })
  run('tar', ['-xzf', tarball, '--strip-components=1', '-C', unpacked], consumer)
  for (const dependency of ['react', 'react-dom', '@types/react', '@types/react-dom']) {
    const target = join(consumer, 'node_modules', dependency)
    mkdirSync(join(target, '..'), { recursive: true })
    symlinkSync(join(repositoryModules, dependency), target)
  }
  return unpacked
}
