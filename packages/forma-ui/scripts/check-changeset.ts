// Changeset check: a pull request that changes what the package ships adds a changeset.
//
//   node --experimental-strip-types scripts/check-changeset.ts [base] [head]
//
// It compares `head` (default HEAD) with its merge base with `base` (default origin/main). In the pull request workflow
// the checkout is the merge commit, so the call is `HEAD^1 HEAD`: what the pull request adds to the current main. The
// rule, its exemptions and the way to declare «no release notes» (`npx changeset --empty`) are in
// scripts/changeset-check/policy.ts and in CONTRIBUTING.md.
import { isChangesetFile, judge, publishedManifest, type Change } from './changeset-check/policy.ts'
import { fail, run, runCheck } from './check-support.ts'

const [base = 'origin/main', head = 'HEAD'] = process.argv.slice(2)
const manifestPath = 'packages/forma-ui/package.json'

runCheck('Changeset check', () => {
  // The repository root, wherever the script is started from.
  const root = run('git', ['rev-parse', '--show-toplevel'], process.cwd()).trim()
  const git = (...args: string[]) => run('git', args, root)

  const mergeBase = git('merge-base', base, head).trim()
  const changes: Change[] = git('diff', '--name-status', '--no-renames', mergeBase, head)
    .split('\n')
    .filter((line) => line !== '')
    .map((line) => {
      const [status = '', path = ''] = line.split('\t')
      return { status, path }
    })

  const manifestChanged = changes.some(({ path }) => path === manifestPath)
    ? publishedManifest(git('show', `${mergeBase}:${manifestPath}`)) !==
      publishedManifest(git('show', `${head}:${manifestPath}`))
    : false

  const added = changes.filter(({ status, path }) => status === 'A' && isChangesetFile(path))
  const addedChangesets = new Map(added.map(({ path }) => [path, git('show', `${head}:${path}`)]))

  const { ok, message } = judge(changes, manifestChanged, addedChangesets)
  if (!ok) fail(message)
  console.log(`Changeset check passed: ${message}`)
})
