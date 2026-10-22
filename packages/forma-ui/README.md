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

- **Without layers, your CSS comes after the package's.** A `className` you pass to a component has the same specificity
  as the component's own rule (for example `.forma-badge__blue`), so the later stylesheet wins: yours has to come after
  `styles.css`.
- **Bundlers order CSS by chunk, not by the order of your `@import`s.** With Vite, for example, the CSS of a shared
  chunk (your component modules) reaches the page before the CSS of the entry. Import `@yelison/forma-ui/styles.css`
  first in the module that loads your components (your UI barrel, or the first module that imports from
  `@yelison/forma-ui`), not only from your entry stylesheet: then its rules land at the start of that chunk, before your
  own component CSS. Check the order in your production build, not only in the dev server.
- **Layers change the rule: between layers, the order of loading decides nothing; the order of the layers does, and the first `@layer` statement fixes it.** `styles.css` has no layer, and CSS
  without a layer beats CSS in a layer whatever the specificity (with `!important` it is the other way round). So the CSS
  you write in layers, such as the utilities of Tailwind v4 or an `@layer base` reset, **loses** to the rules of the
  components, even when it is loaded after them. The standard fix is to give the package a layer of its own, in the
  order you want, and to declare that order before anything else:

  ```css
  @layer base, forma, utilities;

  @import '@yelison/forma-ui/tokens.css';
  @import '@yelison/forma-ui/styles.css' layer(forma);
  @import '@yelison/forma-ui/base.css';
  ```

  With that, a utility in `@layer utilities` wins over the rule of a component, and a reset in `@layer base` does not win
  over the box of a control, in whatever order the files load. `layer()` only works in a CSS `@import`, not in a
  JavaScript `import '…css'`. A reset **without** a layer still beats the package once it is in one, and so does your
  unlayered CSS: put every reset in `base`. With Tailwind v4, whose `@import 'tailwindcss'` declares
  `theme, base, components, utilities`, declare your order first and keep those names, for example
  `@layer theme, base, forma, components, utilities;`. The browser tests (`test/browser/layers.test.tsx`) check this
  recipe in Chromium.

- **A reset that has no layer replaces the box of the controls.** A reset for form controls, such as
  `button, input, select, textarea { font: inherit; color: inherit }`, normalize or the preflight of Tailwind v3, belongs
  in `@layer base { … }`, and if the package is in a layer of its own, that layer comes after `base` as above. Without a layer, the box of a control is written
  with `:where()`, which has no specificity, on purpose: one class of yours adjusts it without depending on the order of
  the stylesheets. A reset without a layer has the specificity of an element, so it wins over that box and replaces the
  font, the padding and the line height of every control. The text colour is the exception only while the package has
  no layer: it is written with the specificity of a class, so an unlayered reset does not change it. Tailwind v4 already
  puts its preflight in a layer like this.

  ```css
  @layer base {
    button,
    input,
    select,
    textarea {
      font: inherit;
      color: inherit;
    }
  }
  ```

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
- With a Content Security Policy, allow that inline script by hash or nonce. A hash is computed from the exact text of
  the script, so compute it from `themeScript(...)` itself (at build or start-up) rather than pasting a fixed value. A
  change to the text that `themeScript` returns ships as at least a minor version, never a patch, so an automatic patch
  update cannot break a hashed policy.

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

## Monospace type

Two tokens cover code: `--font-family-mono`, the system monospace stack (the package bundles no monospace font), and
`--font-code`, a style of the same weight and line height as `--font-body` at 13/20.

Use `--font-code` for a block of code, or an interface (a token field, a log line) that sits at the size of the body:

```css
.snippet {
  font: var(--font-code);
}
```

Code inline in text of another size, such as a heading or a 16/24 paragraph, takes the family alone and a size relative
to its text, `0.93em` (13/14). It then scales with the text and leaves the line height of the line as it was:

```css
code {
  font-family: var(--font-family-mono);
  font-size: 0.93em;
}
```

## Components

`Alert`, `Badge`, `Button`, `IconButton`, `FilterChip`, `Icon`, `Input`, `SearchField`, `Select` and `Radio` forward the attributes of their native element. `Field`, `Menu`, `Disclosure`, `Tooltip`, `Dialog`, `Tabs` and `Avatar` take only the props they document.

| Component               | Use it for                                                                                   | Accessibility                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`                | An action; `primary`, `secondary`, `ghost` or `danger`; `size` `default` or `compact`.       | A native `button` whose `type` is `button` unless set. While `loading` it stays focusable with `aria-busy` and `aria-disabled`; `disabled` is for an unavailable action. `size="compact"` is 36 px tall instead of 42 (`--button-height-compact`); below 768 px both are `--touch-target` (44 px), so the compact one never falls under the touch minimum.                                                                                                                                                       |
| `IconButton`            | An action with an icon and no visible text.                                                  | `label` is required and becomes `aria-label`; show it in a `Tooltip` too.                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `Alert`                 | A message that stays on the page, with a title and a body, in four tones.                    | Plain by default. With `live` it is `role="alert"` for `red` and `role="status"` for the others: keep it mounted and change its text when the message arrives (see below).                                                                                                                                                                                                                                                                                                                                       |
| `Badge`                 | A short status or category tag, in six tones.                                                | The tone only colors it: the text has to say the same thing.                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `Field`                 | A label, hint and error around a control you provide.                                        | Links them with `id` and `aria-describedby`, sets `aria-invalid` and announces the error with `role="alert"`; `announce="off"` shows it without announcing it.                                                                                                                                                                                                                                                                                                                                                   |
| `Input`                 | A native text input with its `Field`.                                                        | Same linking as `Field`, and it forwards `announce` to it; `hideLabel` keeps the label for screen readers and draws nothing; `disabled` and `readOnly` stay different.                                                                                                                                                                                                                                                                                                                                           |
| `SearchField`           | A search box with a magnifier, controlled by `value`.                                        | A native `type="search"` named by `label`, which is not drawn. `Escape` clears a field with text and goes no further; a read-only field keeps its text.                                                                                                                                                                                                                                                                                                                                                          |
| `FilterChip`            | A filter: a toggle in a row of chips, or the trigger of its options.                         | With `aria-haspopup` it draws a chevron and adds no `aria-pressed`; without it, it is a toggle with `aria-pressed` from `selected` (see below).                                                                                                                                                                                                                                                                                                                                                                  |
| `Menu`                  | A menu of actions or options that opens from a button of yours.                              | The ARIA menu button pattern: arrows, `Home`, `End`, a first letter, `Escape` and `Tab` (see below). The name of an item is its label; a second line is its description.                                                                                                                                                                                                                                                                                                                                         |
| `Disclosure`            | A button that shows and hides a region, in a line of content or as the heading of a section. | The ARIA disclosure pattern: `aria-expanded`, `aria-controls` and a `hidden` region, with the focus kept on the button. `headingLevel` puts it in a heading and `actions` sit outside the button (see below).                                                                                                                                                                                                                                                                                                    |
| `Select`                | A native `<select>` with its `Field`.                                                        | Same linking as `Input`, with the browser's keyboard and picker. No read-only state: `disabled` leaves the tab order, `aria-disabled` dims it and keeps the focus.                                                                                                                                                                                                                                                                                                                                               |
| `Icon`                  | One of the library's icons, as inline SVG.                                                   | Decorative and hidden from screen readers unless you give it a `label`. `iconNames` lists every `IconName`, 44 of them, in alphabetical order, so `folder-plus`, `list-ordered` and `star-filled` follow `folder`, `list` and `star`. `share` means "send or export" (a box with an arrow leaving it), not "give people access". The set is outline only, except `star-filled`: it is filled to show a state (pinned), so the button that uses it must carry `aria-pressed` and not leave the state to the icon. |
| `Tooltip`               | A short description for a control.                                                           | Opens on hover and on keyboard focus, stays open while the pointer travels onto it, `Escape` closes it, and it describes the trigger with `aria-describedby`.                                                                                                                                                                                                                                                                                                                                                    |
| `Dialog` (also `Modal`) | A modal on the native `<dialog>`.                                                            | Opened with `showModal()`: focus stays inside and the page behind is inert. `Escape` and a backdrop click call `onClose`, and focus returns to the opener.                                                                                                                                                                                                                                                                                                                                                       |
| `Tabs`                  | Panels that share one place, one visible at a time.                                          | The ARIA tabs pattern: arrows wrap, `Home` and `End` jump, `Tab` goes from the selected tab to its panel. Selecting is automatic. `label` names the tab list.                                                                                                                                                                                                                                                                                                                                                    |
| `Radio`                 | One option of a group that takes a single choice.                                            | A native radio in its label: group it in a `fieldset` with a `legend` and one `name`. Arrows select, `disabled` skips an option, no read-only.                                                                                                                                                                                                                                                                                                                                                                   |
| `Avatar`                | A round picture of a person, or their initials.                                              | An image named after `name`, or hidden with `decorative` when the name is beside it. A picture that fails to load gives way to the initials. `tone` takes the tones of `Badge`.                                                                                                                                                                                                                                                                                                                                  |

`Input`, `SearchField` and `Select` share one contract for classes: `fieldClassName` goes to the container, the `.forma-field` element that holds the label, the box and the messages, and `className` goes to the control, the `<input>` or `<select>`, which is the box you can see. Decorate the box with `className`, and match its focus with `:focus` on the control, not with `:focus-within` on the container. A control paints its text with `--color-ink` (`--color-muted` when disabled) whatever colour its parent has, even under a reset such as `input { color: inherit }`. Only the colour is protected: the rest of the box (`padding`, `font`) can still be overridden by a reset of yours. If you keep a copy of the box of these controls, follow the rule of the colour, which has the specificity of a class and sits outside `:where()`, while the rest of the box stays inside it (see [the 0.5.0 changelog](https://github.com/Yelison/forma-ui/blob/main/packages/forma-ui/CHANGELOG.md#050)).

`SearchField` is always controlled and leaves two native props out: `defaultValue`, since the text lives in your component and the field only shows it, and `children`, since an input has none and the magnifier is all the field adds. The types refuse both.

`initialsOf(name)` gives the initials that `Avatar` draws for a name, so that something that is not an avatar, such as a workspace, can show the same letters. An empty or blank name gives an empty string.

`Dialog` takes `presentation="sheet-on-narrow"` to become a bottom sheet below 768 px (a CSS media query, so there is no
flash on resize): pinned to the bottom edge at the full width, with rounded top corners, a decorative handle, up to about
90% of the viewport height with its own scroll, the bottom safe area added to its padding, and the footer buttons stacked
at the full width. From 768 px it is the usual centered dialog, and the default `presentation="dialog"` is that at every
width. The footer reads bottom to top: the DOM order is unchanged, so the first button, the one that takes the initial
focus, is the lowest, and the last is on top. Put the safe action first and the primary action last, and Tab goes from the
bottom button to the top one. The handle is decorative: it is not dragged. The stacking reaches the direct children of the footer, so buttons wrapped in another element stay as they are. With `prefers-reduced-motion` the sheet does not slide in.

`Alert` is a `div` with a `title` and a body, the `children`. An action is a `Button` or a link inside the body: there is no
`action` prop and no close button. With `live` it is a live region, `role="alert"` for `red` and `role="status"` for the
other tones, which suits a message that appears after an action. A message that is there when the page loads must not be
`live`, or it interrupts the screen reader before the user has done anything. A screen reader announces what changes
inside a live region it already knows, so keep the `Alert` mounted and change its `title` and `children` when the message
arrives; one that is added to the page together with its message may go unannounced, `status` ones above all.

```tsx
<Alert tone="red" title="Connection lost" live>
  We could not reach the server.
  <Button variant="secondary" onClick={retry}>
    Retry
  </Button>
</Alert>
```

`FilterChip` has two modes, chosen by `aria-haspopup` (any value but `false`): with it, the chip opens something your
application shows (set `aria-expanded` too), draws a chevron and only looks selected; without it, it is a toggle button
that announces `selected` as `aria-pressed`, with no chevron. `aria-pressed` is not a prop. A row of toggles is a
single-choice filter without panels: put them in a `role="group"` with an `aria-label` or `aria-labelledby` you provide,
in your language (the library has no text of its own for it), and keep which chip is `selected` in your state.

```tsx
<div role="group" aria-label="Permission">
  {options.map((option) => (
    <FilterChip key={option} selected={option === active} onClick={() => setActive(option)}>
      {option}
    </FilterChip>
  ))}
</div>
```

`Menu` opens from the element you spread its `trigger` props on (a `Button`, an `IconButton` or a `FilterChip`, which draws its
chevron because the props carry `aria-haspopup="menu"`). It opens in a portal, inside the closest `<dialog>` when there is
one, and gives the focus back to the trigger when it closes. `Tab` closes it and the focus goes on from the trigger. An item
with `checked` is a `menuitemradio`: one option of a group, and your state keeps which one. `search` adds a field for the
`searchable` items, and its two texts, like the `label` of the menu and its `note`, are yours, in your language: the
library has no text of its own for `Menu`.

```tsx
<Menu label="Ticket actions" items={[{ id: 'assign', label: 'Assign owner', onSelect: assign }]}>
  {(trigger) => <IconButton icon="more" label="More actions" {...trigger} />}
</Menu>
```

`Disclosure` is a button with `aria-expanded` and `aria-controls` and a region that is `hidden` while it is closed: its content
stays mounted, so keep your own `display` rules off the region and on what it holds. `variant="inline"` (the default) is a block, the button
with its chevron after the text and the region under it: it draws a `div`, so it cannot go inside a paragraph, and a button inside
a sentence is a `DisclosureButton` instead. and `variant="section"` is the heading of a part of the page: the chevron
comes first, `headingLevel` puts the button in a heading, and `actions` hold controls such as a `Menu` trigger, beside the
button and outside it. `open` and `onOpenChange` control it (without `onOpenChange` a controlled one never opens), and
`buttonProps` takes the attributes of the button, such as `aria-describedby`. Below 768 px the button is 44 px tall, a touch target,
so an inline one makes its line taller there. The summary and the region are yours, in your
language: the library has no text of its own for `Disclosure`. A link cannot go inside a button, so a row whose sentence has one
is built from `DisclosureRoot`, `DisclosureButton` and `DisclosureRegion`, which `Disclosure` is made of: the button is a part
of the row and the region goes where you place it.

```tsx
<Disclosure variant="section" headingLevel={3} summary="Launch" actions={<FolderMenu />}>
  <ul>{/* the documents */}</ul>
</Disclosure>
```

`Tabs` starts the arrows from the selected tab, not the focused one. With a controlled `value` whose parent refuses a tab, the focus still moves to it, but the next arrow press goes on from the selected tab.

Also exported: `buttonClassName` and `iconButtonClassName` (the classes of a button and of an icon button, for a link that must look like one; see below), `useScrollLock` (the
scroll lock of the dialog, for an overlay of your own), `useFormaStrings` and `defaultStrings` (the text the components show
on their own), `contrastRatio` and `relativeLuminance` (WCAG contrast, over `#rgb` and `#rrggbb` colors) and every props
type next to its component.

### A link drawn as an icon button

`iconButtonClassName` gives a link the box, the hover and the focus ring of an `IconButton`, with no `href` or `render` prop on the component. The link keeps its own semantics, so it is yours to name: the icon has no text, and without an `aria-label` a screen reader reads only the address.

```tsx
import { Icon, Tooltip, iconButtonClassName } from '@yelison/forma-ui'

;<Tooltip content="Version history" describe={false}>
  {(trigger) => (
    <a href="/history" aria-label="Version history" className={iconButtonClassName()} {...trigger}>
      <Icon name="clock" />
    </a>
  )}
</Tooltip>
```

The same goes for the `Link` of a router: pass `className={iconButtonClassName()}` and an `aria-label`. A link cannot be `disabled`, so the disabled look of `IconButton` is not available to it.

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

| What you import   | Size     |
| ----------------- | -------- |
| Everything        | 11.34 kB |
| `{ Menu }`        | 5.87 kB  |
| `{ Disclosure }`  | 3.92 kB  |
| `{ SearchField }` | 3.73 kB  |
| `{ Select }`      | 3.60 kB  |
| `{ FilterChip }`  | 3.30 kB  |
| `{ Button }`      | 3.57 kB  |
| `{ Tabs }`        | 0.66 kB  |
| `{ Avatar }`      | 0.59 kB  |
| `{ Alert }`       | 0.36 kB  |
| `{ Radio }`       | 0.31 kB  |
| `{ Badge }`       | 0.26 kB  |
| `{ iconNames }`   | 0.21 kB  |
| `styles.css`      | 3.06 kB  |

`Button`, `Disclosure`, `FilterChip`, `Menu`, `SearchField` and `Select` are not small because `Icon` looks its path up in one object that holds every icon, so
the whole table travels with any component that draws an icon (44 icons, about 3 kB gzip; importing each icon on its own is a debt already noted, and would take most of that weight off them). `iconNames` is a plain list of strings: a bundler drops it when you do not use it,
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
