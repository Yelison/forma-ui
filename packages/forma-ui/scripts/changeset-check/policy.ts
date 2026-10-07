// The rule behind scripts/check-changeset.ts: a pull request that changes what the package ships adds a changeset.
// It works on lists and strings, so that the tests need no repository; the git calls are in the script. Erasable
// TypeScript only, so that Node's type stripping can run it.
import { packageName } from '../check-support.ts'

/** One entry of `git diff --name-status --no-renames`: `A`dded, `M`odified or `D`eleted. */
export interface Change {
  status: string
  path: string
}

const packageFolder = 'packages/forma-ui/'

// Besides src/ and tokens/, what else decides the bytes of dist/: the TypeScript configuration that emits the
// declarations (tsconfig.build.json extends the package's tsconfig.json, which extends the repository's
// tsconfig.base.json), the Vite configuration, and the generators with the helper they write through. A change to one
// of them that is meant for something else, such as the site, is declared with an empty changeset. package-lock.json
// is exempt on purpose: a dependency update can change dist/, but Dependabot cannot add a changeset, and the builds
// and checks of the pull request are what catch a regression.
const buildInputs = new Set([
  'tsconfig.base.json',
  ...[
    'vite.config.ts',
    'tsconfig.json',
    'tsconfig.build.json',
    'scripts/build-tokens.ts',
    'scripts/build-icons.ts',
    'scripts/scoped-name.ts',
    'scripts/script-utils.ts',
  ].map((file) => packageFolder + file),
])

const isTest = (path: string) => /\.test\.tsx?$/.test(path)

/**
 * Whether a file other than package.json can change the published package: the sources, the token source and the
 * build inputs. Tests are exempt. README.md and LICENSE are packed too, but they are published with the next release
 * anyway and have no line in a changelog, so they are exempt as well, like the rest of the documentation.
 */
export function shapesPackage(path: string): boolean {
  if (path.startsWith(`${packageFolder}src/`)) return !isTest(path)
  return path.startsWith(`${packageFolder}tokens/`) || buildInputs.has(path)
}

/**
 * package.json without what no consumer sees: the version (bumped by the release pull request, which consumes the
 * changesets instead of adding one), the scripts and the development dependencies. What stays is `exports`, `files`,
 * the peer dependencies, `engines` and the rest of the contract.
 */
export function publishedManifest(manifest: string): string {
  const { version: _version, scripts: _scripts, devDependencies: _devDependencies, ...published } = JSON.parse(manifest)
  return JSON.stringify(published)
}

/** The path of a changeset file: `.changeset/*.md`, but not the folder's README. */
export const isChangesetFile = (path: string) =>
  /^\.changeset\/[^/]+\.md$/.test(path) && path !== '.changeset/README.md'

/**
 * Whether a changeset speaks for the package: it names `@yelison/forma-ui` in its front matter, or it is the empty
 * one that `changeset --empty` writes, which declares that the change needs no release notes. A changeset that names
 * only the private site never reaches the changelog, so it does not count (CONTRIBUTING.md).
 */
export function declaresPackage(changeset: string): boolean {
  const frontMatter = changeset.match(/^---\r?\n([\s\S]*?)\r?\n?---/)?.[1]
  if (frontMatter === undefined) return false
  return frontMatter.trim() === '' || new RegExp(`^['"]?${packageName}['"]?:`, 'm').test(frontMatter)
}

export interface Verdict {
  ok: boolean
  message: string
}

const howToAdd =
  'Add one with `npm run changeset`, or, if nothing changes for the people who install the package, declare it with ' +
  '`npx changeset --empty` (see CONTRIBUTING.md, «The changeset check»).'

/**
 * @param changes the files the pull request changes
 * @param manifestChanged whether package.json changed in a way that `publishedManifest` sees
 * @param addedChangesets the content of each changeset file the pull request adds, by path
 */
export function judge(
  changes: readonly Change[],
  manifestChanged: boolean,
  addedChangesets: ReadonlyMap<string, string>,
): Verdict {
  const touched = changes.filter(({ path }) => shapesPackage(path)).map(({ path }) => path)
  if (manifestChanged) touched.push(`${packageFolder}package.json`)
  if (touched.length === 0) return { ok: true, message: 'No file that shapes the published package changed.' }

  const declared = [...addedChangesets].filter(([, content]) => declaresPackage(content)).map(([path]) => path)
  if (declared.length > 0) return { ok: true, message: `Covered by ${declared.join(', ')}.` }

  const list = touched.map((path) => `  - ${path}`).join('\n')
  const ignored = [...addedChangesets.keys()]
  const note = ignored.length > 0 ? ` ${ignored.join(', ')} does not name ${packageName}, so it does not count.` : ''
  return {
    ok: false,
    message: `The pull request changes what the package ships, with no changeset:\n${list}\n${howToAdd}${note}`,
  }
}
