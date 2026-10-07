// Types and exports, the way each kind of tool reads them. `exports` is read by Node (CommonJS and ESM) and by
// bundlers; `main` and `types` by the tools that predate it (`moduleResolution: node10`). The three are checked by the
// standard linters, run on the tarball and not on the sources, and by compiling the consumer under `bundler`.
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fail, packageName, repositoryModules, run } from '../check-support.ts'
import type { PackCheckStep } from './context.ts'
import { readManifest } from './manifest.ts'

/** Runs a command of the devDependencies, from the `.bin` folder of the repository's node_modules. */
const runBin = (name: string, args: string[], cwd: string) => run(join(repositoryModules, '.bin', name), args, cwd)

export const checkDeclarations: PackCheckStep = ({ tarball, unpacked, consumer }) => {
  // publint: the package.json against how Node and the bundlers read it (conditions order, missing files, formats).
  // Strict makes its warnings errors; its suggestions are listed and fail as well.
  runBin('publint', ['run', '--strict', tarball], consumer)

  // attw: do the declarations resolve, and to the right kind of file, in node10, node16 (CommonJS and ESM) and bundler?
  // Only the entry points that declare `types` are asked: the CSS and JSON exports have no declarations to be wrong,
  // and the consumer check resolves them. `node10` cannot resolve them at all, since it ignores `exports`:
  // that is the documented limit of the CSS subpaths, not something to patch with stub files in the package root.
  // `cjs-resolves-to-esm` is ignored on purpose: the package is ESM only. Its `default` condition lets Node 22.12+
  // `require()` it, and attw would flag that for any ESM-only package.
  const typed = Object.entries(readManifest(unpacked).exports)
    .filter(([, target]) => typeof target === 'object' && 'types' in target)
    .map(([subpath]) => subpath)
  runBin('attw', [tarball, '--entrypoints', ...typed, '--ignore-rules', 'cjs-resolves-to-esm', '--no-color'], consumer)

  // `require()` of the entry point, which only the `default` condition makes work: Node 22.12+ loads an ES module from
  // CommonJS, and without the condition it throws ERR_PACKAGE_PATH_NOT_EXPORTED. attw cannot see that, because it
  // treats an ESM-only package as one that is not meant to be required.
  if (!process.features.require_module)
    fail('pack:check needs Node 22.12+ to check that `require()` of the entry point works')
  run(process.execPath, ['--input-type=commonjs', '-e', `require('${packageName}')`], consumer)

  // The declarations as the TypeScript compiler of a bundler project reads them, over the whole tree (skipLibCheck is off).
  run(
    process.execPath,
    [createRequire(import.meta.url).resolve('typescript/bin/tsc'), '-p', 'tsconfig.bundler.json'],
    consumer,
  )

  return `Declarations: publint --strict clean; attw resolves ${typed.map((subpath) => `${packageName}${subpath.slice(1)}`).join(', ')} in node10, node16 and bundler; the consumer compiles under bundler; require() of the entry point loads.`
}
