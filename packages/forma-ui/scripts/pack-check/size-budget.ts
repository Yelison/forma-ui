// The weight a consumer pays, in bytes sent over the network: minified, then gzipped at level 9, the best a server can
// do and a figure that does not move with the compression level of whoever runs the check. What is measured is what a
// consumer's bundler produces from the installed tarball, with React left out as it is in a real application:
//   - `dist/index.js`: every export, as `export * from` keeps them all;
//   - `import { Button }` and `import { Badge }`: what one component costs, which is the tree-shaking proof, since a
//     module with a side effect or an export that is not a named one pulls in everything. Badge is the smallest
//     component and has no icon: its budget catches what Button's, which carries the whole icon table, would hide;
//   - `dist/styles.css`: one file for every component, whether the consumer uses them all or not.
//
// Each budget is the size measured when it was set plus about 20%, rounded up to a hundred bytes: room for a component
// or two, not for a dependency that slipped in. A change that needs more raises the number here, in the same pull
// request and with the reason in its description, so that growth is a decision somebody reviews.
//
// Measured on 2026-10-06, with the eight components of v0.1 (Button, IconButton, Badge, Field, Input, Icon, Tooltip,
// Dialog): 7318 B for every export, 3073 B for Button alone, 1479 B for styles.css and, added on 2026-10-09, about
// 360 B for Badge alone. Button alone is not small because Icon looks its path up in one object that holds every icon,
// so the whole table travels with any component that draws an icon.
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { fail, kilobytes } from '../check-support.ts'
import { bundle } from './bundle.ts'
import type { PackCheckStep } from './context.ts'

interface Budget {
  /** What is measured, as the message names it. */
  name: string
  /** The entry the consumer's bundler starts from. */
  entry: string
  /** Which emitted file is measured. */
  extension: '.js' | '.css'
  /** The most the file may weigh, minified and gzipped, in bytes. */
  limit: number
}

const budgets: Budget[] = [
  {
    name: 'dist/index.js (every export)',
    entry: `export * from '@yelison/forma-ui'`,
    extension: '.js',
    limit: 8800,
  },
  {
    name: 'import { Button } from the package',
    entry: `export { Button } from '@yelison/forma-ui'`,
    extension: '.js',
    limit: 3700,
  },
  {
    name: 'import { Badge } from the package',
    entry: `export { Badge } from '@yelison/forma-ui'`,
    extension: '.js',
    limit: 500,
  },
  {
    name: 'dist/styles.css',
    entry: `import '@yelison/forma-ui/styles.css'`,
    extension: '.css',
    limit: 1800,
  },
]

async function measure({ entry, extension }: Budget, consumer: string, index: number): Promise<number> {
  const file = join(consumer, `size-${index}.ts`)
  writeFileSync(file, `${entry}\n`)
  const output = await bundle(consumer, {
    minify: true,
    cssMinify: true,
    lib: { entry: file, formats: ['es'], fileName: `size-${index}`, cssFileName: `size-${index}` },
    rolldownOptions: { external: [/^react(-dom)?($|\/)/] },
  })
  const emitted = output.find((item) => item.fileName.endsWith(extension))
  if (emitted === undefined) fail(`the bundle of \`${entry}\` has no ${extension} file`)
  return gzipSync(emitted.type === 'chunk' ? emitted.code : emitted.source, { level: 9 }).length
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
