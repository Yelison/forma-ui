# @yelison/forma-ui

Accessible React components and design tokens, extracted from [Resolve](https://github.com/Yelison/resolve). Nothing is
published to npm yet, so there is no install command to give.

## Importing the CSS

The package ships its CSS as three files. Import them once, in the entry point of your application, in this order:

```ts
import '@yelison/forma-ui/tokens.css' // the design tokens, as CSS custom properties; light, dark and system themes
import '@yelison/forma-ui/styles.css' // the rules of every component
import '@yelison/forma-ui/base.css' // the utility classes that some components apply
// then your own CSS
```

- The package's files go before your own CSS. A `className` you pass to a component has the same specificity as the
  component's own rule (for example `.forma-badge__blue`), so the later stylesheet wins: yours has to come after
  `styles.css`.
- `tokens.css` is the foundation: the component rules read its custom properties, and without it they render unstyled.
  The custom properties resolve whatever the order of the sheets, so it comes first by convention.
- `styles.css` is one file for all the components, whether you use them all or not. Importing `@yelison/forma-ui` pulls
  in no CSS and has no side effects: the components are tree-shakeable, the stylesheet is yours to place.
- `base.css` holds two utility classes, `.forma-visually-hidden` and `.forma-scroll-locked`, and nothing that could
  match your own markup. Components that need them apply them by name: the scroll lock of a modal dialog is
  `.forma-scroll-locked`. Import it unless you use no such component.
- A consumer without React, such as an identity provider's login theme, imports `tokens.css` alone.

The component classes are named `forma-<module>__<class>` (for example `forma-badge__blue`), or `forma-<module>` for
the class that repeats the module's name (`forma-badge`). They are readable in DevTools but are not a styling API:
restyle through the tokens, and pass your own `className` to a component.

## How the build is checked

`npm run check:consumer` packs the package, installs it into a throwaway project, compiles that project with
`moduleResolution: nodenext` and runs it. It fails if a CSS export does not resolve, if `index.js` imports CSS, if a
class in `styles.css` lacks the `forma-` prefix, if a rendered component carries a class with no rule or if a CSS
module has no class rendered at all. The build lists the classes of every module in `dist/css-modules.json`, which is
not packed. A component that ships CSS is added to `scripts/consumer/main.tsx`.

`npm run pack:check` looks at the tarball that `npm pack` writes, and fails with a message that names the file or the
rule:

- **Contents:** only `dist/**` (without `dist/css-modules.json`), `package.json`, `README.md`, `LICENSE` and, once it
  exists, `CHANGELOG.md`; everything `main`, `types` and `exports` point at is in it; `react` and `react-dom` are peer
  dependencies, never dependencies; `LICENSE` is the repository's.
- **Types and exports:** [publint](https://publint.dev) in strict mode and
  [Are The Types Wrong?](https://arethetypeswrong.github.io) read the packed `package.json` and resolve the typed
  entry point in `node10`, `node16` (CommonJS and ESM) and `bundler`; the consumer is compiled under `bundler`; and
  `require()` of the entry point must load on Node 22.12+. The CSS and JSON subpaths have no declarations to check,
  and `node10` cannot resolve them because it ignores `exports`.
