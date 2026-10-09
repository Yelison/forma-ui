// One copy of React. Two copies break hooks and context at run time ("Invalid hook call"), and the usual way to get a
// second one is a library that bundles React instead of leaving it to its peer dependency. A consumer's build cannot
// show that by looking at the module graph alone: React inlined into the library is part of the library's own
// modules, and the only React in the graph is the application's. So the check has two sides:
//   - no packed module imports anything but `react`, `react-dom` and its own modules, and none holds React code;
//   - the consumer's production bundle resolves `react`, `react-dom` and `scheduler` to one folder each.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fail, packageName } from '../check-support.ts'
import { bundle } from './bundle.ts'
import type { PackCheckStep } from './context.ts'
import { packedModules, staticSpecifiers } from './modules.ts'

// What React's own source carries and a library that only calls it never does: the symbol its elements are tagged with
// and the handle that react-dom uses to reach the hooks dispatcher.
const reactSource = /Symbol\.for\(["']react\.|__CLIENT_INTERNALS_DO_NOT_USE|__SECRET_INTERNALS_DO_NOT_USE/
const peerSpecifier = /^react(-dom)?(\/|$)/

// React's runtime in the bundle. `scheduler` is a dependency of react-dom that a consumer never imports itself: it is
// checked for a second copy but not required.
const reactRuntimePackages = ['react', 'react-dom', 'scheduler']
const requiredPackages = ['react', 'react-dom']

export const checkSingleReact: PackCheckStep = async ({ consumer, files, unpacked }) => {
  const modules = packedModules(files)
  for (const path of modules) {
    const source = readFileSync(join(unpacked, path), 'utf8')
    const foreign = staticSpecifiers(source).filter(
      (specifier) => !specifier.startsWith('.') && !peerSpecifier.test(specifier),
    )
    if (foreign.length > 0)
      fail(`${path} imports ${[...new Set(foreign)].join(', ')}: the package has no dependencies besides its peers`)
    if (reactSource.test(source))
      fail(`${path} contains React itself: \`react\` and \`react-dom\` must stay external in vite.config.ts`)
  }

  const chunks = (await bundle(consumer, { rolldownOptions: { input: join(consumer, 'client.tsx') } })).filter(
    (output) => output.type === 'chunk',
  )
  const ids = chunks.flatMap((chunk) => Object.keys(chunk.modules))
  // Any module of dist/: the entry point is a barrel that the bundler may leave out of the graph once it has followed its exports.
  if (!ids.some((id) => id.includes(`/node_modules/${packageName}/dist/`)))
    fail('the consumer bundle does not contain the packed package: client.tsx no longer imports it')

  const roots = new Map<string, Set<string>>()
  for (const id of ids) {
    const match = /^(.*\/node_modules\/([^/]+))\//.exec(id)
    if (match && reactRuntimePackages.includes(match[2]!))
      roots.set(match[2]!, (roots.get(match[2]!) ?? new Set()).add(match[1]!))
  }
  for (const name of reactRuntimePackages) {
    const found = roots.get(name)
    if (found === undefined) {
      if (requiredPackages.includes(name))
        fail(`the consumer bundle does not contain ${name}: client.tsx no longer renders with it`)
      continue
    }
    if (found.size > 1) fail(`the consumer bundle contains ${found.size} copies of ${name}: ${[...found].join(', ')}`)
  }

  const version = (name: string) =>
    (JSON.parse(readFileSync(join([...roots.get(name)!][0]!, 'package.json'), 'utf8')) as { version: string }).version
  return `Single React: the consumer bundle (${ids.length} modules) has one copy of react ${version('react')} and of react-dom ${version('react-dom')}; the packed modules (${modules.length}) import only react, react-dom and each other, and none has React code in it.`
}
