// Reproducible pack: two clean builds of the same commit must pack to the same tarball, byte for byte.
//
//   node --experimental-strip-types scripts/pack-reproducible.ts [ref]      (default ref: HEAD)
//
// Each build starts from `git archive` of the commit in a new folder, installs with `npm ci`, builds and runs `npm pack`,
// like the Release workflow does, so that nothing from the working tree (untracked files, a stale dist/) or from the
// folder's path can reach the tarball. It compares the sha256 of the two tarballs and, when they differ, names the files
// that do. A build that writes a date or an absolute path into dist/ fails here, and not on the day somebody compares a
// published tarball with a local one.
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { fail, packageName, packageRoot, run, runCheck } from './check-support.ts'

const repositoryRoot = join(packageRoot, '..', '..')
const sha256 = (data: Buffer) => createHash('sha256').update(data).digest('hex')

interface Build {
  workspace: string
  tarball: string
  sha256: string
}

/** A clean checkout of `ref` in a folder of its own, built and packed. */
function buildAndPack(ref: string, label: string): Build {
  const workspace = mkdtempSync(join(tmpdir(), `forma-repro-${label}-`))
  const source = join(workspace, 'source')
  const output = join(workspace, 'out')
  mkdirSync(source)
  mkdirSync(output)

  run('git', ['archive', '--format=tar', '--output', join(workspace, 'source.tar'), ref], repositoryRoot)
  run('tar', ['-xf', join(workspace, 'source.tar'), '-C', source], workspace)
  run('npm', ['ci'], source)
  run('npm', ['run', 'build', '-w', packageName], source)
  const [{ filename }] = JSON.parse(
    run('npm', ['pack', '-w', packageName, '--json', '--pack-destination', output], source),
  ) as [{ filename: string }]
  const tarball = join(output, filename)
  return { workspace, tarball, sha256: sha256(readFileSync(tarball)) }
}

/** The sha256 of every file in the tarball, by path, to say which files make two tarballs differ. */
function fileHashes(build: Build): Map<string, string> {
  const unpacked = join(build.workspace, 'unpacked')
  mkdirSync(unpacked)
  run('tar', ['-xzf', build.tarball, '-C', unpacked], build.workspace)
  const entries = readdirSync(unpacked, { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile())
  return new Map(
    entries.map((entry) => {
      const path = join(entry.parentPath, entry.name)
      return [relative(unpacked, path), sha256(readFileSync(path))]
    }),
  )
}

runCheck('Reproducible pack', () => {
  const ref = process.argv[2] ?? 'HEAD'
  const commit = run('git', ['rev-parse', '--short', ref], repositoryRoot).trim()
  const first = buildAndPack(ref, 'a')
  const second = buildAndPack(ref, 'b')
  console.log(`${commit} packed twice:\n  ${first.sha256}  ${first.tarball}\n  ${second.sha256}  ${second.tarball}`)

  if (first.sha256 !== second.sha256) {
    const [one, two] = [fileHashes(first), fileHashes(second)]
    const differing = [...new Set([...one.keys(), ...two.keys()])]
      .filter((path) => one.get(path) !== two.get(path))
      .sort()
    // The folders stay, so that the two builds can be compared with `diff -r`.
    fail(
      `two clean builds of ${commit} give different tarballs. Files that differ:\n${differing.map((path) => `  - ${path}`).join('\n')}\n` +
        `Look for a date, a random value or an absolute path in the build. The builds are in ${first.workspace} and ${second.workspace}.`,
    )
  }

  rmSync(first.workspace, { recursive: true, force: true })
  rmSync(second.workspace, { recursive: true, force: true })
  console.log(`Reproducible pack passed: two clean builds of ${commit} give the same tarball.`)
})
