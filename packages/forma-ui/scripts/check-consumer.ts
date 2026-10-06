// Consumer check: installs the package the way a consumer receives it and proves that it works from there, not from
// the sources.
//
//   node --experimental-strip-types scripts/check-consumer.ts      (after `npm run build`)
//
// 1. `npm pack` writes the tarball, so only what `files` publishes reaches the consumer.
// 2. The tarball is unpacked into the node_modules of a throwaway project (scripts/consumer/) that resolves the
//    package through its `exports`, with `moduleResolution: nodenext`.
// 3. The project is compiled, so the declarations resolve, and then run: it renders the sample components.
// 4. Every file the consumer imports (tokens.css, styles.css) must resolve through `exports`, `index.js` must not
//    import CSS, and every class a rendered component carries must have a rule in styles.css.
//
// This is the seed of the pack-check of the plan (Task 5.1), which grows it: the same tarball and project, plus the
// list of packed files, the declarations of every export, the absence of `react` in `dependencies` and a bundler
// build of the consumer. The script sticks to erasable TypeScript so that Node's type stripping can run it.
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const packageRoot = resolve(import.meta.dirname, '..')
const repositoryModules = resolve(packageRoot, '../../node_modules')
const packageName = '@yelison/forma-ui'
// What the consumer imports besides the entry point: the CSS the README tells it to import.
const consumedFiles = ['tokens.css', 'styles.css', 'base.css']

function fail(message: string): never {
  console.error(`Consumer check failed: ${message}`)
  process.exit(1)
}

function run(command: string, args: string[], cwd: string): string {
  try {
    return execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  } catch (error) {
    const { stdout = '', stderr = '' } = error as { stdout?: string; stderr?: string }
    return fail(`\`${[command, ...args].join(' ')}\` exited with an error:\n${stdout}${stderr}`)
  }
}

function install(consumer: string) {
  const scope = join(consumer, 'node_modules', '@yelison')
  mkdirSync(scope, { recursive: true })
  const [{ filename }] = JSON.parse(
    run('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', consumer], packageRoot),
  ) as [{ filename: string }]
  const unpacked = join(scope, 'forma-ui')
  mkdirSync(unpacked)
  run('tar', ['-xzf', join(consumer, filename), '--strip-components=1', '-C', unpacked], consumer)
  // The peer dependencies the consumer would install itself: the repository's copies stand in for them.
  for (const dependency of ['react', 'react-dom', '@types/react', '@types/react-dom']) {
    const target = join(consumer, 'node_modules', dependency)
    mkdirSync(join(target, '..'), { recursive: true })
    symlinkSync(join(repositoryModules, dependency), target)
  }
  return unpacked
}

function resolveExport(consumer: string, file: string): string {
  try {
    return createRequire(join(consumer, 'main.js')).resolve(`${packageName}/${file}`)
  } catch {
    return fail(`${packageName}/${file} does not resolve: check \`exports\` in package.json`)
  }
}

if (!existsSync(join(packageRoot, 'dist', 'index.js'))) fail('dist/ is missing: run `npm run build` first')

const consumer = mkdtempSync(join(tmpdir(), 'forma-consumer-'))
cpSync(join(packageRoot, 'scripts', 'consumer'), consumer, { recursive: true })
writeFileSync(join(consumer, 'package.json'), JSON.stringify({ name: 'forma-consumer', private: true, type: 'module' }))
const unpacked = install(consumer)

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
if (rendered.size === 0 && selectors.length > 0)
  fail(
    'styles.css has rules but the consumer renders no component with them: add the component to scripts/consumer/main.tsx',
  )

console.log(
  `Consumer check passed: nodenext compile, ${consumedFiles.length} CSS exports, ${rendered.size} rendered classes with rules in styles.css (${new Set(selectors).size} unique classes shipped).`,
)
