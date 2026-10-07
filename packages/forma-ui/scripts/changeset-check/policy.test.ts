import assert from 'node:assert/strict'
import { test } from 'node:test'
import { declaresPackage, judge, publishedManifest, shapesPackage, type Change } from './policy.ts'

const changed = (...paths: string[]): Change[] => paths.map((path) => ({ status: 'M', path }))
const changeset = (frontMatter: string) => `---\n${frontMatter}\n---\n\nSummary.\n`
const withChangeset = (content: string) => new Map([['.changeset/brave-lions-sing.md', content]])
const none = new Map<string, string>()

test('a change in src/ without a changeset fails and names the file', () => {
  const verdict = judge(changed('packages/forma-ui/src/components/Button/Button.tsx'), false, none)
  assert.equal(verdict.ok, false)
  assert.match(verdict.message, /src\/components\/Button\/Button\.tsx/)
  assert.match(verdict.message, /changeset --empty/)
})

test('a change in src/ with a changeset of the package passes', () => {
  const verdict = judge(
    changed('packages/forma-ui/src/components/Button/Button.tsx'),
    false,
    withChangeset(changeset("'@yelison/forma-ui': patch")),
  )
  assert.equal(verdict.ok, true)
})

test('an empty changeset declares a change that needs no release notes', () => {
  assert.equal(judge(changed('packages/forma-ui/src/index.ts'), false, withChangeset('---\n---\n')).ok, true)
})

test('a changeset that names only the site does not cover the package', () => {
  const verdict = judge(
    changed('packages/forma-ui/src/index.ts'),
    false,
    withChangeset(changeset("'forma-ui-site': patch")),
  )
  assert.equal(verdict.ok, false)
  assert.match(verdict.message, /does not name @yelison\/forma-ui/)
})

test('tests, documentation, the site and the workflows need no changeset', () => {
  const verdict = judge(
    changed(
      'packages/forma-ui/src/components/Button/Button.test.tsx',
      'packages/forma-ui/src/tokens/build-tokens.test.ts',
      'packages/forma-ui/README.md',
      'packages/forma-ui/scripts/pack-check.ts',
      'site/src/main.tsx',
      '.github/workflows/ci.yml',
      'CONTRIBUTING.md',
    ),
    false,
    none,
  )
  assert.equal(verdict.ok, true)
})

test('what decides the bytes of dist/ counts: tokens, build configuration and the generators', () => {
  for (const path of [
    'packages/forma-ui/tokens/color.json',
    'packages/forma-ui/vite.config.ts',
    'packages/forma-ui/scripts/scoped-name.ts',
    'packages/forma-ui/scripts/script-utils.ts',
    'packages/forma-ui/tsconfig.json',
    'tsconfig.base.json',
  ]) {
    assert.equal(shapesPackage(path), true, path)
  }
})

test('a change to the contract in package.json counts, one to the version or the scripts does not', () => {
  const before = JSON.stringify({
    version: '0.1.0',
    scripts: { a: '1' },
    devDependencies: { x: '1' },
    exports: { '.': 'a' },
  })
  const bumped = JSON.stringify({
    version: '0.2.0',
    scripts: { a: '2' },
    devDependencies: { x: '2' },
    exports: { '.': 'a' },
  })
  const exported = JSON.stringify({
    version: '0.1.0',
    scripts: { a: '1' },
    devDependencies: { x: '1' },
    exports: { '.': 'b' },
  })
  assert.equal(publishedManifest(before), publishedManifest(bumped))
  assert.notEqual(publishedManifest(before), publishedManifest(exported))
  assert.equal(judge([], true, none).ok, false)
})

test('the release pull request, which deletes changesets and adds none, passes', () => {
  const verdict = judge(
    [
      { status: 'D', path: '.changeset/first-release.md' },
      { status: 'M', path: 'packages/forma-ui/package.json' },
      { status: 'A', path: 'packages/forma-ui/CHANGELOG.md' },
    ],
    false,
    none,
  )
  assert.equal(verdict.ok, true)
})

test('declaresPackage reads the front matter only', () => {
  assert.equal(declaresPackage(changeset('"@yelison/forma-ui": minor')), true)
  assert.equal(declaresPackage('Mentions @yelison/forma-ui in the text, without front matter.'), false)
  assert.equal(
    declaresPackage(`---\n'forma-ui-site': patch\n---\n\n'@yelison/forma-ui': minor\n`),
    false,
    'the name of the package in the body does not count when the front matter names another package',
  )
  assert.equal(
    declaresPackage(`---\n---\n\n'@yelison/forma-ui': minor\n`),
    true,
    'an empty front matter is the empty changeset',
  )
})
