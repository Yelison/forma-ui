// The weight a consumer pays, in bytes sent over the network: minified, then gzipped at level 9, the best a server can
// do and a figure that does not move with the compression level of whoever runs the check. What is measured is what a
// consumer's bundler produces from the installed tarball, bundled as an application, with React left out as it is in a
// real application:
//   - every export: a module that uses the whole namespace, so nothing can be dropped;
//   - `import { Button }` and `import { Badge }`: what one component costs, which is the tree-shaking proof, since a
//     module with a side effect or an export that is not a named one pulls in everything. Badge is the smallest
//     component and has no icon: its budget catches what Button's, which carries the whole icon table, would hide;
//   - `import { iconNames }`: the list of names alone, which must not bring the table of paths with it;
//   - `dist/styles.css`: one file for every component, whether the consumer uses them all or not.
//
// An application build, not a library build: a library build leaves a `//#region <path>` comment for every module,
// and the package is one module per source file, so those comments weigh more as the modules multiply and an
// application's bundle never has them. The entry uses what it imports (`console.log`) so the bundler keeps it.
//
// Each budget is the size measured when it was set plus about 20%, rounded up to a hundred bytes: room for a component
// or two, not for a dependency that slipped in. A change that needs more raises the number here, in the same pull
// request and with the reason in its description, so that growth is a decision somebody reviews.
//
// Measured on 2026-10-10, with the nine components of v0.1 (Button, IconButton, Badge, Field, Input, Icon, Tooltip,
// Dialog, Tabs) and the package as one bundled file: 7192 B for every export (7290 B with `iconNames`), 2910 B for Button alone, 225 B for Badge
// alone and 1551 B for styles.css; Tabs alone is 661 B. Button alone is not small because Icon looks its path up in one
// object that holds every icon, so the whole table travels with any component that draws an icon.
//
// Radio, on 2026-10-10: 7.44 kB for every export, 0.31 kB for Radio alone and 1.80 kB for styles.css, which was 1.55 kB.
// The stylesheet is the one that grew (Radio and the choice rules it shares with the checkbox and the switch to come) and
// its budget had no room left for it, so it goes from 1800 to 2200 B.
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fail, kilobytes } from '../check-support.ts'
import { bundle, gzipBytes } from './bundle.ts'
import type { PackCheckStep } from './context.ts'

interface Budget {
  /** What is measured, as the message names it. */
  name: string
  /** The module of the consumer that the bundler starts from. */
  source: string
  /** Which emitted file is measured. */
  extension: '.js' | '.css'
  /** The most the file may weigh, minified and gzipped, in bytes. */
  limit: number
}

const budgets: Budget[] = [
  {
    name: 'dist/index.js (every export)',
    source: `import * as forma from '@yelison/forma-ui'\nconsole.log(forma)`,
    extension: '.js',
    limit: 8100,
  },
  {
    name: 'import { Button } from the package',
    source: `import { Button } from '@yelison/forma-ui'\nconsole.log(Button)`,
    extension: '.js',
    limit: 3600,
  },
  {
    name: 'import { Badge } from the package',
    source: `import { Badge } from '@yelison/forma-ui'\nconsole.log(Badge)`,
    extension: '.js',
    limit: 300,
  },
  {
    name: 'import { iconNames } from the package',
    source: `import { iconNames } from '@yelison/forma-ui'\nconsole.log(iconNames)`,
    extension: '.js',
    limit: 200,
  },
  {
    name: 'dist/styles.css',
    source: `import '@yelison/forma-ui/styles.css'`,
    extension: '.css',
    limit: 2200,
  },
]

async function measure({ source, extension }: Budget, consumer: string, index: number): Promise<number> {
  const file = join(consumer, `size-${index}.ts`)
  writeFileSync(file, `${source}\n`)
  const output = await bundle(consumer, {
    minify: true,
    cssMinify: true,
    rolldownOptions: { input: file, external: [/^react(-dom)?($|\/)/] },
  })
  const emitted = output.find((item) => item.fileName.endsWith(extension))
  if (emitted === undefined) fail(`the bundle of \`${source}\` has no ${extension} file`)
  return gzipBytes(emitted.type === 'chunk' ? emitted.code : emitted.source)
}

export const checkSizeBudget: PackCheckStep = async ({ consumer }) => {
  const sizes: string[] = []
  const over: string[] = []
  for (const [index, budget] of budgets.entries()) {
    const size = await measure(budget, consumer, index)
    sizes.push(`${budget.name} ${kilobytes(size)} of ${kilobytes(budget.limit)}`)
    if (size > budget.limit)
      over.push(
        `${budget.name} weighs ${kilobytes(size)} minified and gzipped, ${kilobytes(size - budget.limit)} over its budget of ${kilobytes(budget.limit)}`,
      )
  }
  if (over.length > 0)
    fail(
      `${over.join('; ')}. The budgets are in scripts/pack-check/size-budget.ts: reduce the weight, or raise the budget and say why`,
    )
  return `Size budget (minified, gzip level 9): ${sizes.join('; ')}.`
}
