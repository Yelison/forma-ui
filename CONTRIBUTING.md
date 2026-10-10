# Contributing

Read [`AGENTS.md`](AGENTS.md) for the working rules and [`CLAUDE.md`](CLAUDE.md) for the scope of the project. Every change
lands through a pull request, squash-merged by default (rebase when a task needs its commits on `main`), and `main` is
protected: `Library`, `Site` and `Site e2e` must pass.

## Changesets

`@yelison/forma-ui` is versioned with [Changesets](https://github.com/changesets/changesets). A changeset is a small
Markdown file in `.changeset/` that says what changed for the people who use the package and how big the bump is. The
release notes (`packages/forma-ui/CHANGELOG.md`) are the changesets, joined.

### When a pull request needs one

Add a changeset to every change that is visible to someone who installs the package:

- a new, changed or removed component, prop, export, subpath (`./tokens.css`, `./tokens.json`…) or token;
- a different default, a different behavior, an accessibility fix or a bug fix;
- a different peer dependency range, supported Node version or module format.

It does not need one when nothing changes for that person: tests, CI, tooling, documentation, refactors that keep the
behavior, and everything under `site/`. The site is private and never versioned or published, so a change that only
touches it has no changeset: Changesets rejects one that names the site alongside the package, and one that names only
the site is never consumed by `npm run version-packages` and stays in `.changeset/`. Delete it if it shows up. The
release workflow does not count it.

### The changeset check

The `Changeset` job of CI runs `npm run check:changeset -w @yelison/forma-ui` on every pull request and fails when the
pull request changes what the package ships and adds no changeset. It looks at these files:

- `packages/forma-ui/src/**`, except `*.test.ts` and `*.test.tsx`;
- `packages/forma-ui/tokens/**`, the token source;
- what decides the bytes of `dist/`: in `packages/forma-ui/`, `vite.config.ts`, `tsconfig.json`, `tsconfig.build.json`
  and `scripts/build-tokens.ts`, `build-icons.ts`, `scoped-name.ts` and `script-utils.ts`; and the repository's
  `tsconfig.base.json`, which the package's configuration extends and which also configures the site;
- `packages/forma-ui/package.json`, apart from `version`, `scripts` and `devDependencies`: `exports`, `files`, the peer
  dependencies and `engines` are the package's contract. The versioning pull request changes only the version, and it
  deletes changesets instead of adding one, so it passes.

Tests, documentation (including the package's README, which npm shows with the next release anyway), the site, the
workflows and the rest of the tooling are exempt, and so is `package-lock.json`: a dependency update can change
`dist/`, but Dependabot cannot add a changeset, and the build and the checks of its pull request are what catch a
regression. The added changeset has to name `@yelison/forma-ui`, or be empty. When
a pull request touches one of those files but changes nothing for the people who install the package (a refactor that
keeps the output, a test-only change to `vite.config.ts`, a change to `tsconfig.base.json` meant only for the site),
declare it:

```sh
npx changeset --empty
```

It writes a changeset with no packages, which the check accepts and which adds nothing to the changelog. Commit it with
the change, and say in the pull request why nothing changes for consumers.

`Changeset` is not one of the required checks (`Library`, `Site` and `Site e2e`): making it one is the owner's decision,
in the branch protection rules.

### How to add one

```sh
npm run changeset
```

It asks for the bump and a summary, and writes `.changeset/<random-name>.md`, which you commit with the change. Write the
summary for the consumer, in the present tense, with the name of what changed (`Button`, `--color-brand`) in code
formatting. One changeset per user-visible change, so that each one has its own line in the changelog.

### Which bump

Versions follow [Semantic Versioning](https://semver.org). The package is below 1.0, where a minor release may break:

| Bump    | Use it for                                                                   |
| ------- | ---------------------------------------------------------------------------- |
| `minor` | A new feature, **any visual change**, or a breaking change while below 1.0.  |
| `patch` | A fix that changes nothing anyone can see, and nothing anyone must react to. |
| `major` | Not used before 1.0. It is the release of `1.0.0`, decided by the owner.     |

**Breaking** is a change that makes code or styles that worked with the previous version stop working, or work
differently, without the consumer changing anything:

- removing or renaming an export, a prop, a subpath or a public CSS custom property (`--color-*`, `--space-*`…);
- changing a prop's type, default or behavior, a default string, or the value of a token;
- narrowing the supported `react` or Node range, or dropping a module format.

**A visual change is never a patch.** Anything that can change how a component or page looks (CSS, a token value, the
markup a component renders) is at least `minor`. Consumers such as Resolve merge patch releases automatically once
their checks pass, so a patch must never change how anything looks; reviewers check the bump of every changeset against
this rule.

The `forma-*` class names are not API (see the package's README) and changing them is not breaking. Start the summary of
a breaking change with `**Breaking:**` and say what to do instead, so that it is easy to find in the changelog. Consumers
pin an exact version.

## Releasing

The package is published to npm only by the `Release` workflow (`.github/workflows/release.yml`), which uses
[npm trusted publishing](https://docs.npmjs.com/trusted-publishers): there is no npm token in the repository, and
`publishConfig.provenance` makes `npm publish` fail anywhere else. Never publish from a workstation.

1. **Changesets pile up** on `main`, one per pull request that needed it.
2. **Version the package** in a normal pull request, from a branch of `main`:

   ```sh
   npm run version-packages
   ```

   It bumps `packages/forma-ui/package.json`, writes `packages/forma-ui/CHANGELOG.md`, deletes the changesets and
   refreshes `package-lock.json`. Commit all of it as `chore(release): version packages`. Read the changelog: it is what
   users will read. The pull request goes through the same checks as any other. If another pull request with a changeset
   of the package is merged before this one, discard the version commit and run `npm run version-packages` again on the
   current `main`: a version commit that carries a changeset it did not consume is not published (see below).

3. **Merge it.** On the push to `main`, the workflow compares the version in the repository with npm. If npm does not have
   it, the workflow runs the CI checks, builds the package, runs `npm run pack:check`, packs the tarball, publishes it
   with `--provenance` and tags the commit `@yelison/forma-ui@<version>`. If npm already has the version, or it is
   `0.0.0`, the workflow does nothing. It also refuses to publish when the version is missing from npm but changesets of
   the package are still pending: that commit is not the one that versioned the package (see below).
4. **Check it** (`npm view @yelison/forma-ui version`; the package page on npmjs.com shows the provenance badge that
   links to the workflow run).

If a `Release` run fails or is cancelled, fix the cause if there is one and repeat **the run of the version commit** (the one
that bumped the version), from the Actions tab:

- **Re-run all jobs** when `Verify`, `Build tarball` or `Publish` did not finish (an unstable test, a network error, a
  cancelled run). It starts from `Plan`, which asks npm again, so a version that was published is not published twice.
- **Re-run failed jobs** when only `Tag` failed, after `Publish` had succeeded. It reuses what the finished jobs
  produced and creates the tag; it does not look at npm again and does not publish.

Do not rely on the next push to `main` to publish it. GitHub keeps one waiting run per group, so a version commit
followed quickly by other merges may never get its own run. A run of a later commit that has changesets of the package
pending does not publish the version (`Plan` fails with «Not the version commit»); one without them publishes its own tree
under that version, which is why you repeat the run of the version commit: it is the only one that has the tree the
changelog describes.

`Plan` fails the same way on the version commit itself when a changeset of the package reached `main` after
`npm run version-packages` and the pull request was merged anyway: repeating the run fails again, because the changeset is
still there. Version again in a new pull request, on the current `main`: it consumes the changeset, and the `Release` run
of that commit publishes.

A published version can never be replaced: ship a fix as the next patch and, if the version is dangerous,
`npm deprecate` it.

To see what a release would do, without publishing anything: `npx changeset status` lists the pending bumps, and in a
throwaway clone `npm run version-packages` followed by `npm publish -w @yelison/forma-ui --dry-run` lists the files of the
tarball. Do not commit that result: the versioning pull request does.

### The first publication (owner, once)

npm can only configure a trusted publisher for a package that already exists, so the name has to be created once from the
owner's machine. It must not be `0.1.0`: that version has to come from the workflow, so that it carries the provenance.
It is a placeholder, in an empty folder outside the repository:

```sh
mkdir forma-ui-placeholder && cd forma-ui-placeholder
cat > package.json <<'JSON'
{
  "name": "@yelison/forma-ui",
  "version": "0.0.1-bootstrap.0",
  "description": "Placeholder that reserves the name. Use 0.1.0 or later.",
  "license": "MIT",
  "repository": { "type": "git", "url": "git+https://github.com/Yelison/forma-ui.git" }
}
JSON
npm login
npm publish --access public --tag bootstrap
```

Then, in this order:

1. On npmjs.com, in the package's **Settings**, add a **Trusted Publisher** of type GitHub Actions: user `Yelison`,
   repository `forma-ui`, workflow `release.yml` and environment `npm`.
2. `npm deprecate "@yelison/forma-ui@0.0.1-bootstrap.0" "Placeholder. Use 0.1.0 or later."` (while the session of
   `npm login` is still open).
3. `npm dist-tag ls @yelison/forma-ui`. The placeholder was published with `--tag bootstrap`: npm may or may not also
   point `latest` at it, and until `0.1.0` is out `npm install @yelison/forma-ui` either installs the deprecated
   placeholder or fails. Both are harmless: `0.1.0` is published without a tag, so it moves `latest` in either case.
4. Under **Publishing access**, choose _Require two-factor authentication and disallow tokens_.
5. `npm logout`, and revoke any token the session created (npmjs.com → Access Tokens). Nothing keeps a credential.
6. Open and merge the versioning pull request. The workflow publishes `0.1.0`.

Never `npm unpublish` the placeholder: removing the only version of a package removes the package and its trusted publisher
with it.
