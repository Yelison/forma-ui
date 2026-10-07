// Consumer check: installs the package the way a consumer receives it and proves that it works from there, not from
// the sources.
//
//   node --experimental-strip-types scripts/check-consumer.ts      (after `npm run build`)
//
// 1. `npm pack` writes the tarball, so only what `files` publishes reaches the consumer.
// 2. The tarball is unpacked into the node_modules of a throwaway project (scripts/consumer/) that resolves the
//    package through its `exports`, with `moduleResolution: nodenext`.
// 3. The project is compiled, so the declarations resolve, and then run: it renders the sample components.
// 4. Every CSS file the README tells the consumer to import must resolve through `exports`, `index.js` must not import
//    CSS, every class of styles.css must start with `forma-`, and every class a rendered component carries must have
//    a rule there.
// 5. The build lists the classes of each CSS module in dist/css-modules.json (it is not packed). A module none of
//    whose classes is rendered fails the check: the component is missing from scripts/consumer/main.tsx. The few
//    modules that a server render cannot paint are listed below, and the browser specs check them instead.
//
// The contents of the tarball, its declarations, a bundler build of the consumer and the size budget are
// scripts/pack-check.ts; this script is about the CSS and the components as a consumer renders them. The scripts
// stick to erasable TypeScript so that Node's type stripping can run them.
import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  createConsumer,
  fail,
  installTarball,
  packageName,
  packageRoot,
  packTarball,
  run,
  runCheck,
} from './check-support.ts'

// What the consumer imports besides the entry point: the CSS the README tells it to import.
const consumedFiles = ['tokens.css', 'styles.css', 'base.css']
// CSS modules whose markup this check cannot see, each with the reason. The consumer renders to a string on the server,
// and these components paint nothing there. Their rules are checked against the real markup in test/browser/, where
// `loadStyles()` loads the built styles.css. Keep the list short: a module that can be rendered here belongs in
// scripts/consumer/main.tsx, and the check fails when a module listed here is rendered or no longer exists.
const renderedInTheBrowser: Record<string, string> = {
  'components/Tooltip/Tooltip.module.css':
    'it is painted in a portal, which the server renderer rejects, and only after an event',
}

function resolveExport(consumer: string, file: string): string {
  try {
    return createRequire(join(consumer, 'main.js')).resolve(`${packageName}/${file}`)
  } catch {
    return fail(`${packageName}/${file} does not resolve: check \`exports\` in package.json`)
  }
}

runCheck('Consumer check', () => {
  if (!existsSync(join(packageRoot, 'dist', 'index.js'))) fail('dist/ is missing: run `npm run build` first')

  const consumer = mkdtempSync(join(tmpdir(), 'forma-consumer-'))
  createConsumer(consumer)
  const unpacked = installTarball(consumer, packTarball(consumer).tarball)

  const entry = readFileSync(join(unpacked, 'dist', 'index.js'), 'utf8')
  if (/(?:import|from)\s*['"][^'"]+\.css['"]/.test(entry))
    fail('dist/index.js imports CSS: importing the package must not')

  const resolved = Object.fromEntries(consumedFiles.map((file) => [file, resolveExport(consumer, file)]))
  const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc')
  run(process.execPath, [tsc, '-p', 'tsconfig.json'], consumer)
  const markup = run(process.execPath, ['out/main.js'], consumer)

  const css = readFileSync(resolved['styles.css']!, 'utf8')
  // The classes of the rule selectors: whatever precedes a `{`, minus the at-rules, so that `.5rem` in a value is not one.
  const selectors = [...css.matchAll(/([^{}]+)\{/g)]
    .filter((rule) => !rule[1]!.trim().startsWith('@'))
    .flatMap((rule) => [...rule[1]!.matchAll(/\.([A-Za-z_-][\w-]*)/g)].map((match) => match[1]!))
  const foreign = selectors.filter((name) => !name.startsWith('forma-'))
  if (foreign.length > 0) fail(`styles.css has classes without the forma- prefix: ${[...new Set(foreign)].join(', ')}`)

  const rendered = new Set(Array.from(markup.matchAll(/class="([^"]*)"/g), (match) => match[1]!.split(/\s+/)).flat())
  const unstyled = [...rendered].filter((name) => !selectors.includes(name))
  if (unstyled.length > 0) fail(`rendered classes with no rule in styles.css: ${unstyled.join(', ')}`)

  // The build lists the classes each CSS module generated (vite.config.ts). A module none of whose classes is rendered
  // is a component whose rules this check never compares with its markup.
  const manifestPath = join(packageRoot, 'dist', 'css-modules.json')
  if (!existsSync(manifestPath)) fail('dist/css-modules.json is missing: run `npm run build` first')
  const modules = Object.entries(JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, string[]>)
  const moduleNames = new Set(modules.map(([path]) => path))
  const unknown = Object.keys(renderedInTheBrowser).filter((path) => !moduleNames.has(path))
  if (unknown.length > 0)
    fail(`renderedInTheBrowser lists CSS modules that the build does not have: ${unknown.join(', ')}. Remove them`)
  const renderedAnyway = modules
    .filter(([path, names]) => path in renderedInTheBrowser && names.some((name) => rendered.has(name)))
    .map(([path]) => path)
  if (renderedAnyway.length > 0)
    fail(`these CSS modules are rendered here, so they leave renderedInTheBrowser: ${renderedAnyway.join(', ')}`)
  const unrendered = modules
    .filter(([path, names]) => !(path in renderedInTheBrowser) && !names.some((name) => rendered.has(name)))
    .map(([path]) => path)
  if (unrendered.length > 0)
    fail(
      `no class of these CSS modules is rendered: ${unrendered.join(', ')}. Add the component to scripts/consumer/main.tsx`,
    )

  const inTheServer = modules.length - Object.keys(renderedInTheBrowser).length
  console.log(
    `Consumer check passed: nodenext compile, ${consumedFiles.length} CSS exports, ${rendered.size} rendered classes with rules in styles.css, one or more for each of the ${inTheServer} CSS modules rendered here; ${Object.keys(renderedInTheBrowser).length} more covered in the browser specs, not here (${new Set(selectors).size} unique classes shipped).`,
  )
})
