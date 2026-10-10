# @yelison/forma-ui

Accessible React components and semantic design tokens, extracted from [Resolve](https://github.com/Yelison/resolve).
Light, dark and system themes, English text by default that you can replace, and native HTML semantics first.

## Install

```sh
npm install @yelison/forma-ui react react-dom
```

React and React DOM are peer dependencies (`^19.2`): the package never bundles its own copy.

## Quick start

Import the three stylesheets once, in the entry point of your application, then use the components:

```tsx
import '@yelison/forma-ui/tokens.css'
import '@yelison/forma-ui/styles.css'
import '@yelison/forma-ui/base.css'
// then your own CSS

import { Button, FormaProvider } from '@yelison/forma-ui'

export function App() {
  return (
    <FormaProvider>
      <Button variant="primary">Save</Button>
    </FormaProvider>
  )
}
```

## The CSS you import

The package ships its CSS as three files, in this order:

| Import                         | What it holds                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------- |
| `@yelison/forma-ui/tokens.css` | The design tokens as CSS custom properties, for the light, dark and system themes.          |
| `@yelison/forma-ui/styles.css` | The rules of every component, in one file.                                                  |
| `@yelison/forma-ui/base.css`   | Two utility classes, `.forma-visually-hidden` and `.forma-scroll-locked`, and nothing else. |

- The package's files go before your own CSS. A `className` you pass to a component has the same specificity as the
  component's own rule (for example `.forma-badge__blue`), so the later stylesheet wins: yours has to come after
  `styles.css`.
- **Bundlers order CSS by chunk, not by the order of your `@import`s.** With Vite, for example, the CSS of a shared
  chunk (your component modules) reaches the page before the CSS of the entry. Import `@yelison/forma-ui/styles.css`
  first in the module that loads your components (your UI barrel, or the first module that imports from
  `@yelison/forma-ui`), not only from your entry stylesheet: then its rules land at the start of that chunk, before your
  own component CSS. Check the order in your production build, not only in the dev server.
- `tokens.css` is the foundation: the component rules read its custom properties, and without it they render unstyled.
- Importing `@yelison/forma-ui` pulls in no CSS and has no side effects: the components are tree-shakeable (see
  [Bundle size](#bundle-size)), and the stylesheet is yours to place. `styles.css` is one file for all the components, whether you use them all or not.
- `base.css` holds only plain `.forma-*` class selectors, so nothing in it can match your own markup. A modal dialog
  applies `.forma-scroll-locked` to `<html>` while it is open: import `base.css` unless you use no such component.
- A consumer without React, such as an identity provider's login theme, imports `tokens.css` alone.
- `tokens.json` (`@yelison/forma-ui/tokens.json`) holds the resolved token values, and `tokenNames` lists the custom
  properties.
- `contrast-pairs.json` (`@yelison/forma-ui/contrast-pairs.json`) lists the color pairs the package keeps readable: for
  each one, the foreground and background tokens (without the `--color-` prefix), the kind of use (`text`, held to 4.5:1,
  or `nonText`, held to 3:1) and the themes it is painted in, with the two thresholds. To check your own theme
  overrides, measure each pair with `contrastRatio` over your values, taking from `tokens.json` the tokens you do not
  override.

The component classes are named `forma-<module>__<class>` and are not a styling API: restyle through the tokens, and
pass your own `className` to a component.

## `FormaProvider` and the library's text

The few strings the components show on their own have English defaults. A `FormaProvider` replaces them for the part of
the application it wraps; entries you leave out keep the value of the closest provider above, or the default.

| Key             | Default    | Where it appears                                                                  |
| --------------- | ---------- | --------------------------------------------------------------------------------- |
| `buttonLoading` | `Loading…` | The accessible name of a `Button` while it is `loading`.                          |
| `dialogClose`   | `Close`    | Returned by `useFormaStrings()`, for a close button you put in a `Dialog` footer. |

```tsx
<FormaProvider strings={{ buttonLoading: 'Enviando…', dialogClose: 'Cerrar' }}>
  <App />
</FormaProvider>
```

A prop on a component wins over the provider (`<Button loading loadingLabel="Saving…">`), and the provider wins over the
default. The provider is optional for an application in English. Read the current strings in your own components with
`useFormaStrings()`.

## Theme

`tokens.css` paints the light theme, follows `prefers-color-scheme` until a theme is chosen, and switches by the
`data-theme` attribute on `<html>`: `light` or `dark` set it, and `system` removes it. The package gives you the pieces
to own that choice:

- `createThemeStore({ storageKey })` creates the store of one application: the preference (`light`, `dark` or
  `system`), kept in `localStorage` under your key and in memory when storage is unavailable. Creating it does not touch
  the page.
- `useTheme(store)` reads it in a component and returns `preference`, `resolved`, `setPreference` and `toggle`.
- `themeScript({ storageKey })` returns a string for an inline `<script>` in `<head>`, so that a reload does not flash
  the theme the operating system prefers before React renders. It must use the same key as the store, and it must be in
  the HTML that is served: a script that React renders does not run.

```tsx
import { createThemeStore, themeScript, useTheme } from '@yelison/forma-ui'

const themeStore = createThemeStore({ storageKey: 'my-app-theme' })

// In the HTML your server or build sends, in <head>:
const firstPaint = `<script>${themeScript({ storageKey: 'my-app-theme' })}</script>`

function ThemeToggle() {
  const { resolved, toggle } = useTheme(themeStore)
  return <button onClick={toggle}>{resolved === 'dark' ? 'Light theme' : 'Dark theme'}</button>
}
```

## Components

`Badge`, `Button`, `IconButton`, `Icon` and `Input` forward the attributes of their native element. `Field`, `Tooltip`, `Dialog` and `Tabs` take only the props they document.

| Component               | Use it for                                              | Accessibility                                                                                                                                                            |
| ----------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Button`                | An action; `primary`, `secondary`, `ghost` or `danger`. | A native `button` whose `type` is `button` unless set. While `loading` it stays focusable with `aria-busy` and `aria-disabled`; `disabled` is for an unavailable action. |
| `IconButton`            | An action with an icon and no visible text.             | `label` is required and becomes `aria-label`; show it in a `Tooltip` too.                                                                                                |
| `Badge`                 | A short status or category tag, in five tones.          | The tone only colors it: the text has to say the same thing.                                                                                                             |
| `Field`                 | A label, hint and error around a control you provide.   | Links them with `id` and `aria-describedby`, sets `aria-invalid` and announces the error with `role="alert"`; `announce="off"` shows it without announcing it.           |
| `Input`                 | A native text input with its `Field`.                   | Same linking as `Field`, and it forwards `announce` to it; `disabled` and `readOnly` stay different states.                                                              |
| `Icon`                  | One of the library's icons, as inline SVG.              | Decorative and hidden from screen readers unless you give it a `label`. `iconNames` lists every `IconName`.                                                              |
| `Tooltip`               | A short description for a control.                      | Opens on hover and on keyboard focus, stays open while the pointer travels onto it, `Escape` closes it, and it describes the trigger with `aria-describedby`.            |
| `Dialog` (also `Modal`) | A modal on the native `<dialog>`.                       | Opened with `showModal()`: focus stays inside and the page behind is inert. `Escape` and a backdrop click call `onClose`, and focus returns to the opener.               |
| `Tabs`                  | Panels that share one place, one visible at a time.     | The ARIA tabs pattern: arrows wrap, `Home` and `End` jump, `Tab` goes from the selected tab to its panel. Selecting is automatic. `label` names the tab list.            |

Also exported: `buttonClassName` (the classes of a button, for a link that must look like one), `useScrollLock` (the
scroll lock of the dialog, for an overlay of your own), `useFormaStrings` and `defaultStrings` (the text the components show
on their own), `contrastRatio` and `relativeLuminance` (WCAG contrast, over `#rgb` and `#rrggbb` colors) and every props
type next to its component.

## Bundle size

The package is published as one ES module per source file (`dist/components/Badge/Badge.js`), and `dist/index.js` only
re-exports them. Your bundler keeps what you import, chunk by chunk: a dialog that loads on demand brings its own code
with it, and the entry chunk of your application does not carry the code of components it never shows on the first
screen.

- **`sideEffects`:** `package.json` declares `"sideEffects": ["*.css"]`. The JavaScript has no effect at import time, so
  a bundler may drop any module you do not use; the three stylesheets are the only files it must keep, because importing
  one is all they are for.
- **Styles:** unchanged. Importing the package still pulls in no CSS: `styles.css` is built beside the modules as one
  file for every component, and you import it yourself, once, as shown in [The CSS you import](#the-css-you-import).
- **Imports:** from the package, `import { Dialog } from '@yelison/forma-ui'`. `exports` is the only way in, so the
  layout of `dist/` can change without breaking you, and there are no per-component subpaths: a bundler that tree-shakes
  already gets the same result from the package root, and each subpath would be a public name to keep.

`npm run pack:check` prints the current sizes, minified and gzipped, and fails when one grows past its budget; its output
is the source of truth. At the time of writing they are:

| What you import | Size    |
| --------------- | ------- |
| Everything      | 7.29 kB |
| `{ Button }`    | 2.91 kB |
| `{ Tabs }`      | 0.66 kB |
| `{ Badge }`     | 0.23 kB |
| `{ iconNames }` | 0.15 kB |
| `styles.css`    | 1.55 kB |

`Button` is not small because `Icon` looks its path up in one object that holds every icon, so the whole table travels
with any component that draws an icon. `iconNames` is a plain list of strings: a bundler drops it when you do not use it,
and importing it alone does not bring the table.

## Compatibility

- **React:** 19.2 or a later 19.x release (`^19.2`), with `react-dom`.
- **Module format:** ES modules only. `import` it; `require()` of the entry point works too, on the Node versions the
  package supports (22.12 or later), which load an ES module from CommonJS.
- **TypeScript:** declarations are included. Use `moduleResolution` `bundler`, `node16` or `nodenext`. `node10`
  resolves the entry point and its types through `main` and `types`, but it ignores `exports`, so it cannot resolve the
  CSS and JSON subpaths: import those through your bundler.
- **Node:** 22.12 or later (`engines`), for server rendering and tooling: it is what the package is tested on.
- **Browsers:** `Dialog` uses the native `<dialog>` element and `showModal()`.

## How the package is verified

The repository's CI checks the packed tarball, as a consumer receives it, not the sources.

`npm run check:consumer` packs the package, installs it into a throwaway project, compiles that project with
`moduleResolution: nodenext` and runs it. It fails if a CSS export does not resolve, if a module of `dist/` imports CSS, if a
class in `styles.css` lacks the `forma-` prefix, if a rendered component carries a class with no rule or if a CSS
module has no class rendered at all. The build lists the classes of every module in `dist/css-modules.json`, which is
not packed. A component that ships CSS is added to `scripts/consumer/main.tsx`.

`npm run pack:check` fails with a message that names the file or the rule:

- **Contents:** only `dist/**` (without `dist/css-modules.json`), `package.json`, `README.md`, `LICENSE` and, once it
  exists, `CHANGELOG.md`; everything `main`, `types` and `exports` point at is in it; `react` and `react-dom` are peer
  dependencies, never dependencies; `LICENSE` is the repository's. The list of `dist/` is closed by a rule, not by
  hand: every module is imported from the entry point, every import resolves to a packed file, and the only other files
  are the stylesheets, `tokens.json` and `contrast-pairs.json`. An orphan module, a test, a source map or a missing
  import fails.
- **Types and exports:** [publint](https://publint.dev) in strict mode and
  [Are The Types Wrong?](https://arethetypeswrong.github.io) read the packed `package.json` and resolve the typed
  entry point in `node10`, `node16` (CommonJS and ESM) and `bundler`; the consumer is compiled under `bundler`; and
  `require()` of the entry point must load on Node 22.12+.
- **One copy of React:** no packed module imports anything but `react`, `react-dom` and its own modules or holds React code, and
  the production bundle of a Vite consumer (`scripts/consumer/client.tsx`) resolves `react`, `react-dom` and
  `scheduler` to one folder each. React inlined into the library cannot be seen from the module graph alone, so the
  first half reads every file.
- **Side effects:** `sideEffects` is a list of patterns that covers every stylesheet in `exports` and no JavaScript.
  The promise behind it is checked too: with the field taken out of a copy of the packed `package.json`, so that the
  bundler has to read every module to know whether it does anything, a bare `import '@yelison/forma-ui'` in a Vite
  consumer (React left external, as in an application) renders no code of the package. A module that sets an attribute
  or a global when it is imported fails there, naming the file. The three stylesheets each emit their CSS when imported.
- **Lazy chunks:** an application that uses `Button` and loads `Dialog` on demand has no `Dialog` code in its entry chunk,
  and the chunk loaded on demand has it. A package that reached the bundler as one module fails this, because the entry
  chunk would carry everything the other chunks use. The entry chunk has a weight budget too
  (`scripts/pack-check/lazy-chunk.ts`).
- **Size budget:** what a Vite consumer's bundler makes of the tarball, bundled as an application, minified and
  gzipped (level 9), with React left out: every export, `import { Button }` alone, `import { Badge }` alone (the
  smallest component, with no icon, so that what `Button` carries cannot hide a regression in it) and
  `dist/styles.css`. Each budget is the size measured plus about 20% and lives in
  `scripts/pack-check/size-budget.ts`; the message names the budget, the size and the excess.

## Versions and publishing

The package follows [Semantic Versioning](https://semver.org), from `0.1.0`. While the version is below 1.0, a minor
release may include breaking changes, and each one is marked **Breaking** in the
[changelog](https://github.com/Yelison/forma-ui/blob/main/packages/forma-ui/CHANGELOG.md): pin an exact version, and
read the changelog before you update.

How a release is made, in short; [CONTRIBUTING.md](https://github.com/Yelison/forma-ui/blob/main/CONTRIBUTING.md) has
the steps, the recovery and the first publication:

- **Versioning:** each pull request that changes what the package ships adds a [Changesets](https://github.com/changesets/changesets)
  file, and the `Changeset` job of CI fails one that does not. A regular pull request runs `npm run version-packages`,
  which bumps the version, writes the changelog and consumes the changesets.
- **Who publishes:** only the `Release` workflow, when that pull request is merged into `main` and npm does not have
  the version yet. It authenticates with npm trusted publishing (OIDC) and no token is stored. Nobody publishes from a
  workstation, and `publishConfig.provenance` makes `npm publish` fail anywhere else.
- **Provenance:** every release is published with [provenance](https://docs.npmjs.com/generating-provenance-statements),
  a signed statement that the tarball was built from this repository by that workflow run. The package page on npm shows
  it, with a link to the run.
- **Verify it:** in a project that installs the package, `npm audit signatures` checks the registry signature and the
  provenance attestation of every installed package that has one.
- **Rebuild it:** `npm run pack:reproducible` builds a commit twice from clean checkouts and fails unless both tarballs
  have the same sha256. To compare a release with its source, check out the tag `@yelison/forma-ui@<version>`, use the
  Node version in `.nvmrc` (other npm versions may pack the same files into different bytes), run `npm ci`,
  `npm run build -w @yelison/forma-ui` and `npm pack -w @yelison/forma-ui`, and compare the tarball's SHA-512
  (`openssl dgst -sha512 -binary <file>.tgz | base64`) with `npm view @yelison/forma-ui@<version> dist.integrity`, which
  holds it after `sha512-`.

## License

[MIT](https://github.com/Yelison/forma-ui/blob/main/LICENSE)
