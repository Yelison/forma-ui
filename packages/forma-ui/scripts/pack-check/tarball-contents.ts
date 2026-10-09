// The files of the tarball. The package publishes `dist/` and the three files npm always adds, nothing else: a stray
// file (a source, a test, a build manifest, an `.env`) would be public for good once it is on npm. The check is a
// closed list in both directions, because a missing file breaks consumers as surely as an extra one leaks.
//
// `dist/` holds one JavaScript module and one declaration file per source module, so its list is closed by a rule and
// not by hand: a `.js` file is there because something imports it, starting from what `main` and `exports` point at;
// a `.d.ts` because the declarations import it or because it describes a module that is there; the stylesheets,
// `tokens.json` and `contrast-pairs.json` by name. Whatever else is in `dist/` (an orphan module, a test, a source map)
// fails, and so does an import of a file the tarball lacks.
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fail, kilobytes, packageRoot } from '../check-support.ts'
import type { PackCheckStep } from './context.ts'
import { entryTargets, readManifest } from './manifest.ts'
import { followImports } from './modules.ts'

const rootFiles = ['package.json', 'README.md', 'LICENSE']
// Written once Changesets runs (plan, Task 5.1b); allowed, never required.
const optionalFiles = ['CHANGELOG.md']
// The files of dist/ that are not modules: the three stylesheets, the resolved tokens and the contrast pairs. The build
// also lists the classes of each CSS module in dist/css-modules.json for scripts/check-consumer.ts: a build product,
// not a package file.
const staticDistFiles = [
  'dist/tokens.css',
  'dist/styles.css',
  'dist/base.css',
  'dist/tokens.json',
  'dist/contrast-pairs.json',
]
const requiredInDist = ['dist/index.js', 'dist/index.d.ts', ...staticDistFiles]
// React is the consumer's: the package asks for it as a peer, never installs a second copy.
const peerPackages = ['react', 'react-dom']

export const checkTarballContents: PackCheckStep = ({ files, unpacked }) => {
  const paths = files.map((file) => file.path)
  const manifest = readManifest(unpacked)

  const outside = paths.filter(
    (path) => !rootFiles.includes(path) && !optionalFiles.includes(path) && !path.startsWith('dist/'),
  )
  if (outside.length > 0)
    fail(
      `the tarball has files that are not dist/**, ${[...rootFiles, ...optionalFiles].join(', ')}: ${outside.join(', ')}. ` +
        'Fix `files` in package.json or the build output',
    )

  const missing = [...new Set([...rootFiles, ...requiredInDist, ...entryTargets(manifest)])].filter(
    (path) => !paths.includes(path),
  )
  if (missing.length > 0)
    fail(`the tarball lacks files that package.json points at or the package needs: ${missing.join(', ')}`)

  const packed = new Set(paths)
  const targets = entryTargets(manifest)
  const modules = followImports(
    targets.filter((path) => path.endsWith('.js')),
    packed,
    unpacked,
  )
  const declarations = followImports(
    targets.filter((path) => path.endsWith('.d.ts')),
    packed,
    unpacked,
    true,
  )
  const dangling = [...modules.missing, ...declarations.missing]
  if (dangling.length > 0) fail(`the tarball lacks files that its own modules import: ${dangling.join('; ')}`)
  const stray = paths.filter(
    (path) =>
      path.startsWith('dist/') &&
      !staticDistFiles.includes(path) &&
      !modules.reached.has(path) &&
      !declarations.reached.has(path) &&
      !(path.endsWith('.d.ts') && modules.reached.has(path.replace(/\.d\.ts$/, '.js'))),
  )
  if (stray.length > 0)
    fail(
      'dist/ has files that nothing imports and that are not a stylesheet, tokens.json or contrast-pairs.json: ' +
        `${stray.join(', ')}. Fix the build output, or \`files\` in package.json`,
    )

  // The copy of the license in this folder exists for npm only: it must not drift from the repository's.
  const repositoryLicense = readFileSync(resolve(packageRoot, '../../LICENSE'), 'utf8')
  if (readFileSync(join(unpacked, 'LICENSE'), 'utf8') !== repositoryLicense)
    fail('packages/forma-ui/LICENSE differs from the LICENSE at the repository root: copy it again')

  const bundled = peerPackages.filter((name) => manifest.dependencies?.[name] !== undefined)
  if (bundled.length > 0) fail(`${bundled.join(', ')} must be peer dependencies, not dependencies`)
  const unpeered = peerPackages.filter((name) => manifest.peerDependencies?.[name] === undefined)
  if (unpeered.length > 0) fail(`${unpeered.join(', ')} are missing from peerDependencies`)

  const size = files.reduce((total, file) => total + file.size, 0)
  return `Tarball contents: ${files.length} files, ${kilobytes(size)} unpacked; only dist/** plus ${rootFiles.join(', ')}; every file in main, types and exports is there; all ${modules.reached.size} modules of dist/ are imported from the entry point, with no import left dangling and no file left over; react and react-dom are peers.`
}
