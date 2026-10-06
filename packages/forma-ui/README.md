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
class in `styles.css` lacks the `forma-` prefix or if a rendered component carries a class with no rule. A component
that ships CSS is added to `scripts/consumer/main.tsx`. This script is the seed of the pack-check (plan, Task 5.1),
which adds the packed file list, the declarations of every export and a bundler build of the consumer.
