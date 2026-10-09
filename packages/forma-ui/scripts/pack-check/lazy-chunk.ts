// Tree-shaking between chunks. An application loads a dialog on demand, so its entry chunk must hold what the first
// screen uses and not what the dialog does. A package that is one module cannot do that: the bundler puts the module in
// the entry chunk because the entry uses it, and with it everything the other chunks use of it.
//
// The consumer is two files: an entry that imports Button and loads `dialog.ts` on demand, and `dialog.ts`, which
// imports Dialog. The entry chunk and the chunks it imports statically (everything the browser fetches before the
// dialog) must not hold any code of Dialog, and the chunk that loads on demand must (otherwise the check would pass
// on a bundle that never contained Dialog). The code of Dialog is recognised by what only it calls: `showModal`, a
// member name that minification keeps.
//
// The weight of that first load has a budget too, with the rule of scripts/pack-check/size-budget.ts: the size measured
// plus about 20%, rounded up to a hundred bytes. Measured on 2026-10-09: 3688 B, which is the modules of Button (2910 B on
// their own) and the preload helper that Vite adds to any application that loads a chunk on demand.
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fail, kilobytes, packageName } from '../check-support.ts'
import { bundle, gzipBytes } from './bundle.ts'
import { staticChunkClosure } from './chunk-graph.ts'
import type { PackCheckStep } from './context.ts'

const dialogCode = 'showModal'
const entryBudget = 4500

export const checkLazyChunk: PackCheckStep = async ({ consumer }) => {
  const entry = join(consumer, 'lazy-entry.ts')
  writeFileSync(entry, `import { Button } from '${packageName}'\nconsole.log(Button)\nimport('./lazy-dialog.ts')\n`)
  writeFileSync(join(consumer, 'lazy-dialog.ts'), `import { Dialog } from '${packageName}'\nconsole.log(Dialog)\n`)
  const chunks = (
    await bundle(consumer, {
      minify: true,
      rolldownOptions: { input: entry, external: [/^react(-dom)?($|\/)/] },
    })
  ).filter((output) => output.type === 'chunk')

  const firstLoad = staticChunkClosure(
    chunks,
    chunks.filter((chunk) => chunk.isEntry),
  )
  const onDemand = chunks.filter((chunk) => !firstLoad.has(chunk))

  const leaked = [...firstLoad].filter((chunk) => chunk.code.includes(dialogCode))
  if (leaked.length > 0)
    fail(
      `the code of Dialog is in the entry chunk of an application that loads it on demand (${leaked.map((chunk) => chunk.fileName).join(', ')}): ` +
        'the package must reach the bundler as separate modules, so that the entry chunk gets only what it uses',
    )

  if (!onDemand.some((chunk) => chunk.code.includes(dialogCode)))
    fail(
      `the chunk that loads Dialog on demand has no \`${dialogCode}\`: this check no longer recognises Dialog's code`,
    )

  const size = [...firstLoad].reduce((total, chunk) => total + gzipBytes(chunk.code), 0)
  if (size > entryBudget)
    fail(
      `the entry chunk of an application that uses Button and loads Dialog on demand weighs ${kilobytes(size)} minified and gzipped, ` +
        `${kilobytes(size - entryBudget)} over its budget of ${kilobytes(entryBudget)}. The budget is in scripts/pack-check/lazy-chunk.ts: ` +
        'reduce the weight, or raise the budget and say why',
    )

  return `Lazy chunks: an application that uses Button and loads Dialog on demand has no Dialog code in its entry chunk (${kilobytes(size)} of ${kilobytes(entryBudget)}), and the chunk loaded on demand has it.`
}
