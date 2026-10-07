// Pack check: the built package as a consumer receives it, before it goes to npm.
//
//   node --experimental-strip-types scripts/pack-check.ts      (after `npm run build`)
//
// `npm pack` writes the tarball, and every step looks at that tarball, never at the sources or at `dist/`:
//   1. its files: only `dist/**` and the files npm always adds, with everything `package.json` points at in it;
//   2. its types and exports, with publint and Are The Types Wrong?, and a `bundler` compile of the consumer;
//   3. a single copy of React in the production bundle of the consumer;
//   4. the size budget of what a consumer's bundler makes of it (scripts/pack-check/size-budget.ts).
// scripts/check-consumer.ts, which also installs the tarball, covers the CSS and the components. The scripts stick to
// erasable TypeScript so that Node's type stripping can run them.
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createConsumer, fail, installTarball, packageRoot, packTarball, runCheck } from './check-support.ts'
import { checkDeclarations } from './pack-check/declarations.ts'
import { checkSizeBudget } from './pack-check/size-budget.ts'
import { checkSingleReact } from './pack-check/single-react.ts'
import { checkTarballContents } from './pack-check/tarball-contents.ts'

const steps = [checkTarballContents, checkDeclarations, checkSingleReact, checkSizeBudget]

runCheck('Pack check', async () => {
  if (!existsSync(join(packageRoot, 'dist', 'index.js'))) fail('dist/ is missing: run `npm run build` first')

  const workspace = mkdtempSync(join(tmpdir(), 'forma-pack-'))
  const { tarball, files } = packTarball(workspace)
  const consumer = join(workspace, 'consumer')
  createConsumer(consumer)
  const unpacked = installTarball(consumer, tarball)

  for (const step of steps) console.log(await step({ tarball, files, unpacked, consumer }))
  // Kept when a step fails, so that the consumer can be inspected.
  rmSync(workspace, { recursive: true, force: true })
  console.log(`Pack check passed: ${steps.length} steps on ${files.length} packed files.`)
})
