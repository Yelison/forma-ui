// `sideEffects` in package.json is a promise to the bundler that the package's JavaScript can be dropped when nothing
// uses it, and that its stylesheets cannot. Three checks, because no one of them shows it all:
//   - the field itself, as webpack, Rollup and esbuild read it: a list of patterns that covers every stylesheet in
//     `exports` and no JavaScript file. Webpack drops an unused import under `"sideEffects": false`, stylesheets
//     included, and Vite does not, so a wrong field would build and look fine here and lose the styles there;
//   - that the promise is true: with the field taken out of a copy of the packed package.json, so that the bundler
//     must read every module to know whether it has an effect, a bare `import '@yelison/forma-ui'` renders no code of
//     the package. A module that does something when it is imported (sets an attribute, registers a listener, assigns
//     a global) keeps itself in the bundle and fails here, where the real field would have let the bundler drop it
//     without a word. React stays external, as in an application, because the bundler cannot tell that a call into it
//     is free of effects;
//   - that each stylesheet export resolves and emits its CSS in a Vite bundle.
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, matchesGlob } from 'node:path'
import type { Rolldown } from 'vite'
import { fail, packageName } from '../check-support.ts'
import { bundle } from './bundle.ts'
import type { PackCheckStep } from './context.ts'
import { entryTargets, readManifest } from './manifest.ts'
import { packedModules } from './modules.ts'

const stylesheets = ['tokens.css', 'styles.css', 'base.css']

export const checkSideEffects: PackCheckStep = async ({ consumer, files, unpacked }) => {
  const manifest = readManifest(unpacked)
  const patterns = manifest.sideEffects
  if (!Array.isArray(patterns))
    fail(
      `\`sideEffects\` in package.json is ${patterns === undefined ? 'missing' : String(patterns)}: it must be a list of the stylesheets, ` +
        'so that the JavaScript is free of side effects and the CSS an application imports is never dropped',
    )
  // A pattern without a slash matches the file name wherever it is, the way bundlers read it.
  const globs = patterns.map((pattern) => (pattern.includes('/') ? pattern.replace(/^\.\//, '') : `**/${pattern}`))
  const hasEffects = (path: string) => globs.some((glob) => matchesGlob(path, glob))
  const dropped = entryTargets(manifest).filter((path) => path.endsWith('.css') && !hasEffects(path))
  if (dropped.length > 0)
    fail(`\`sideEffects\` in package.json does not list ${dropped.join(', ')}: a bundler may drop its import`)
  const kept = packedModules(files).filter(hasEffects)
  if (kept.length > 0)
    fail(`\`sideEffects\` in package.json lists JavaScript, which a bundler then cannot drop: ${kept.join(', ')}`)

  // The package as a consumer would have it without the field, in a project of its own so that the other checks keep
  // the real one. The bundle is made from that project, with React left out.
  const bare = join(consumer, 'bare-import')
  const withoutField = join(bare, 'node_modules', packageName)
  mkdirSync(dirname(withoutField), { recursive: true })
  cpSync(unpacked, withoutField, { recursive: true })
  const packed = JSON.parse(readFileSync(join(unpacked, 'package.json'), 'utf8')) as Record<string, unknown>
  delete packed.sideEffects
  writeFileSync(join(withoutField, 'package.json'), JSON.stringify(packed))
  const bareEntry = join(bare, 'bare-import.ts')
  writeFileSync(bareEntry, `import '${packageName}'\n`)
  const rendering = (
    await bundle(bare, {
      minify: true,
      rolldownOptions: { input: bareEntry, external: [/^react(-dom)?($|\/)/] },
    })
  ).flatMap((output) =>
    output.type === 'chunk'
      ? Object.entries(output.modules)
          .filter(([id, module]) => id.includes(`/node_modules/${packageName}/`) && module.renderedLength > 0)
          .map(([id]) => id.slice(id.indexOf('dist/')))
      : [],
  )
  if (rendering.length > 0)
    fail(
      `a bare \`import '${packageName}'\` renders code of ${rendering.join(', ')} even though nothing is used: ` +
        'these modules do something when they are imported, and `sideEffects` in package.json would let a bundler drop them',
    )

  const bundleStylesheet = async (stylesheet: string) => {
    const file = join(consumer, `import-${stylesheet}.ts`)
    writeFileSync(file, `import '${packageName}/${stylesheet}'\n`)
    return bundle(consumer, { minify: true, rolldownOptions: { input: file } })
  }

  for (const stylesheet of stylesheets) {
    const css = (await bundleStylesheet(stylesheet)).find(
      (output): output is Rolldown.OutputAsset => output.type === 'asset' && output.fileName.endsWith('.css'),
    )
    if (css === undefined || css.source.length === 0)
      fail(
        `\`import '${packageName}/${stylesheet}'\` leaves no CSS in the bundle: \`sideEffects\` in package.json must list the stylesheets`,
      )
  }

  return `Side effects: \`sideEffects\` lists ${patterns.join(', ')}, which covers every stylesheet export and no module; without the field, a bare import of the package renders no code of it; and ${stylesheets.join(', ')} each emit their CSS.`
}
