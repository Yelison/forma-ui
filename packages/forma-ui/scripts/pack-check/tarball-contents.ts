// The files of the tarball. The package publishes `dist/` and the three files npm always adds, nothing else: a stray
// file (a source, a test, a build manifest, an `.env`) would be public for good once it is on npm. The check is a
// closed list in both directions, because a missing file breaks consumers as surely as an extra one leaks.
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fail, kilobytes, packageRoot } from '../check-support.ts'
import type { PackCheckStep } from './context.ts'
import { entryTargets, readManifest } from './manifest.ts'

const rootFiles = ['package.json', 'README.md', 'LICENSE']
// Written once Changesets runs (plan, Task 5.1b); allowed, never required.
const optionalFiles = ['CHANGELOG.md']
// The build lists the classes of each CSS module here for scripts/check-consumer.ts: a build product, not a package file.
const buildOnly = ['dist/css-modules.json']
const requiredInDist = ['dist/index.js', 'dist/index.d.ts', 'dist/tokens.css', 'dist/styles.css', 'dist/base.css']
// React is the consumer's: the package asks for it as a peer, never installs a second copy.
const peerPackages = ['react', 'react-dom']

export const checkTarballContents: PackCheckStep = ({ files, unpacked }) => {
  const paths = files.map((file) => file.path)
  const manifest = readManifest(unpacked)

  const unexpected = paths.filter(
    (path) =>
      !rootFiles.includes(path) &&
      !optionalFiles.includes(path) &&
      !(path.startsWith('dist/') && !buildOnly.includes(path)),
  )
  if (unexpected.length > 0)
    fail(
      `the tarball has files that are not dist/**, ${[...rootFiles, ...optionalFiles].join(', ')}: ${unexpected.join(', ')}. ` +
        'Fix `files` in package.json or the build output',
    )

  const missing = [...new Set([...rootFiles, ...requiredInDist, ...entryTargets(manifest)])].filter(
    (path) => !paths.includes(path),
  )
  if (missing.length > 0)
    fail(`the tarball lacks files that package.json points at or the package needs: ${missing.join(', ')}`)

  // The copy of the license in this folder exists for npm only: it must not drift from the repository's.
  const repositoryLicense = readFileSync(resolve(packageRoot, '../../LICENSE'), 'utf8')
  if (readFileSync(join(unpacked, 'LICENSE'), 'utf8') !== repositoryLicense)
    fail('packages/forma-ui/LICENSE differs from the LICENSE at the repository root: copy it again')

  const bundled = peerPackages.filter((name) => manifest.dependencies?.[name] !== undefined)
  if (bundled.length > 0) fail(`${bundled.join(', ')} must be peer dependencies, not dependencies`)
  const unpeered = peerPackages.filter((name) => manifest.peerDependencies?.[name] === undefined)
  if (unpeered.length > 0) fail(`${unpeered.join(', ')} are missing from peerDependencies`)

  const size = files.reduce((total, file) => total + file.size, 0)
  return `Tarball contents: ${files.length} files, ${kilobytes(size)} unpacked; only dist/** plus ${rootFiles.join(', ')}; every file in main, types and exports is there; react and react-dom are peers.`
}
