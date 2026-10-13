# @yelison/forma-ui

## 0.4.0

### Minor Changes

- 42db460: Add `Avatar`, ported from Resolve with its props (`name`, `size`, `src`, `decorative` and `className`): a round picture of a person that shows their initials when there is no picture or it fails to load. It adds `tone`, which takes the tones of `Badge` and defaults to `blue`, the color Resolve paints.

  Three behaviors improve on Resolve's, which agreed to them: the initials are cut by user-perceived character (an accent written as a combining mark or an emoji stays whole, and a letter whose capital is two letters, like `ß`, stays as it is); an empty `name` hides the avatar from assistive technology instead of leaving an image with no name; and a new `src` is tried after a previous one failed.

  Adds the tokens `--avatar-size-small` (28px), `--avatar-size-medium` (36px) and `--avatar-size-large` (48px), the sizes of the three `size` values. Applications that keep their own copy of `tokens.css` will see it change when they sync it.

- 3f38f9b: Add `SearchField` and `Select`, ported from Resolve, and `hideLabel` on `Input` and `Field`.

  - `SearchField`: a native `type="search"` with a magnifier, controlled by `value` and `onValueChange`; its `label` names it for screen readers and is not drawn. `Escape` clears a field that has text and does not propagate, so a search box in a dialog empties before the dialog closes; a read-only field keeps its text. It takes the box of `Input` (a visual drift from Resolve, which painted `--color-bg`: the background is now `--color-surface`, with the hover and focus states of `Input`).
  - `Select`: a native `<select>` on `Field` with `label`, `hint`, `error`, `announce` and `fieldClassName`, drawn like `Input` with a chevron. `aria-disabled="true"` dims it and keeps it focusable, as in Resolve.
  - `Input` and `Field` take `hideLabel`: the label stays the accessible name and is not drawn, and takes no room; the hint and the error stay visible and described. Without it nothing changes.
  - New token `--control-icon-size` (20px), the size of the icon inside a text control and the room reserved for it.

- 3fae565: `Icon` draws eight new icons: `align`, `clock`, `close`, `comment`, `folder`, `link`, `list` and `star`, drawn on the same 24 grid and 1.7 stroke as the 23 it had, so `IconName` and `iconNames` grow to 31 names. `iconNames` was already alphabetical and now guarantees it: the eight new names fall in among the existing ones, which keep their order, so a list that renders `iconNames` shows them interleaved. Nothing that took an `IconName` changes. `{ Icon }` weighs about 190 B more gzipped, because the table of paths travels whole with the component.

## 0.3.0

### Minor Changes

- 3ae4413: `Dialog` takes a new `presentation` prop. With `presentation="sheet-on-narrow"` it becomes a bottom sheet below 768 px: pinned to the bottom edge at the full width, with rounded top corners, a handle, up to about 90% of the viewport height with its own scroll, the bottom safe area in its padding, and the footer buttons stacked at the full width with the last one on top. From 768 px it looks as before, and the default `presentation="dialog"` changes nothing.

## 0.2.1

### Patch Changes

- 2d10296: Move the four sizes that were still literals in the CSS into tokens: `--choice-min-height` (36px, the row of a `Radio`), `--tabs-panel-focus-offset` (4px, the gap of the focused `Tabs` panel's ring), `--icon-button-glyph-size` (20px, each icon of an `IconButton`) and `--dialog-enter-offset` (8px, where the `Dialog` entrance starts). The computed values do not change. Consumers that keep a synced copy of `tokens.css` will see that copy change, because it gains the four declarations.

## 0.2.0

### Minor Changes

- 3caef97: Add `Radio`, ported from Resolve with the same props (`label` and every native `input` attribute except `type` and `children`; `className` goes to the label): a native radio inside its label, to be grouped by the same `name` in a `fieldset` with a `legend`.
- 417c9c2: Add `Tabs`, ported from Resolve with the same props (`label`, `items`, `value`, `defaultValue`, `onChange`, `className`): the ARIA tabs pattern with arrow keys, `Home` and `End`, and a panel for each tab.
- d1fa3ea: Export `iconNames`, a read-only list of every `IconName` in the order of the icon table, generated with it so that the two cannot drift apart. It replaces the list of names an application kept by hand.

### Documentation

- The README says where to import `styles.css`: bundlers order CSS by chunk, so import it first in the module that loads your components, not only from your entry stylesheet (#55).
- The README says how to allow the `themeScript` first-paint script under a Content Security Policy, and that a change to its output ships as at least a minor version (#58).

## 0.1.0

### Minor Changes

- d76f066: Publish the color pairs the package keeps readable, with their WCAG thresholds, as `@yelison/forma-ui/contrast-pairs.json`, so that a consumer can measure them against `tokens.json`.
- 35bef50: `Field` and `Input` take an `announce` prop: `'off'` shows the error without announcing it (for specimens and documentation, never for a form people fill in), and the default `'assertive'` keeps the `role="alert"` it always had.
- e06c795: First release of Forma UI: accessible React components and semantic design tokens, extracted from Resolve.

  - **Components:** `Button`, `IconButton`, `Badge`, `Field`, `Input`, `Icon`, `Tooltip` and `Dialog` (also exported as `Modal`), with their props types.
  - **Tokens:** the design tokens as CSS custom properties for the light, dark and system themes (`@yelison/forma-ui/tokens.css`), the resolved values (`tokens.json`), the `tokenNames` list and the `contrastRatio` helper.
  - **Theme:** `createThemeStore`, `useTheme` and `themeScript` to own the light, dark or system preference and avoid a flash on first paint.
  - **`FormaProvider`:** replaces the few strings the components show on their own, which default to English.
  - **Distribution:** ES modules with declarations, three stylesheets (`tokens.css`, `styles.css`, `base.css`) and `react` and `react-dom` (`^19.2`) as peer dependencies.

### Patch Changes

- ce8e511: Publish the library as one module per source file, so that a bundler keeps in each chunk only the components it uses. The public API, the stylesheets and their import paths do not change.
